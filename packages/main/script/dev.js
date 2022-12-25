const fs = require('fs')
const { resolve, join } = require('path')
const { spawn } = require('child_process')
const electron = require('electron')
const { esbuildDecorators } = require('@anatine/esbuild-decorators')

let electronProcess = null
let manualRestart = false

process.env.NODE_ENV = 'development'

let envPath = resolve(__dirname, `../../../.env.${process.env.NODE_ENV}.local`)
if (!fs.existsSync(envPath)) {
  envPath = resolve(__dirname, `../../../.env.${process.env.NODE_ENV}`)
}

require('dotenv').config({ path: envPath })

function startMain () {
  return require('esbuild').build({
    entryPoints: [resolve(__dirname, '../src/index.ts'), resolve(__dirname, '../src/preload.ts')],
    bundle: true,
    platform: 'node',
    sourcemap: true,
    target: ['node16.13'],
    external: ['electron', 'pg-hstore', 'aws-sdk', 'nock', 'mock-aws-s3', 'sqlite3', 'typeorm'],
    define: {
      // 开发环境中二进制可执行文件的路径
      __bin__: `"${resolve(__dirname, '../.bin').replace(/\\/g, '\\\\')}"`
    },
    plugins: [esbuildDecorators({
      tsconfig: '../tsconfig.json', cwd: __dirname
    })],
    outdir: resolve(__dirname, '../dist'),
    loader: { '.png': 'file' },
    watch: {
      onRebuild (error, result) {
        if (error) {
          console.error('watch build failed:', error)
        } else {
          console.log('watch build succeed.')
          if (electronProcess && electronProcess.kill) {
            manualRestart = true
            process.kill(electronProcess.pid)
            electronProcess = null
            startElectron()

            setTimeout(() => {
              manualRestart = false
            }, 5000)
          }
        }
      }
    }
  })
}

function startElectron () {
  const args = ['--inspect=5858', join(__dirname, '../dist/index.js')]

  electronProcess = spawn(String(electron), args)

  electronProcess.stdout.on('data', (data) => {
    electronLog(data, 'blue')
  })

  electronProcess.stderr.on('data', (data) => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog (data, color) {
  let log = ''
  data = data.toString().split(/\r?\n/)
  data.forEach((line) => {
    if (line.trim()) log += `${line}\n`
  })
  console.log(log)
}

(async () => {
  try {
    await startMain()
    await startElectron()
  } catch (e) {
    console.error(e)
    process.exit()
  }
})()
