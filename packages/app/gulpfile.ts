import { series, dest, watch } from 'gulp'
import { createProject } from 'gulp-typescript'
import { join } from 'path'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import * as electron from 'electron'
import fs from 'mz/fs'

const tsProject = createProject('tsconfig.json')

let electronProcess: ChildProcessWithoutNullStreams | null = null
let manualRestart = false

function build (): NodeJS.WritableStream {
  return tsProject.src().pipe(tsProject()).js.pipe(dest('dist'))
}

const dev = series(build, startElectron)
const restart = series(build, restartElectron)

watch(['src/**/*'], restart)

function restartElectron (): void {
  console.log('watch build succeed.')
  if ((electronProcess?.pid) != null) {
    manualRestart = true
    process.kill(electronProcess.pid)
    electronProcess = null
    startElectron()

    setTimeout(() => {
      manualRestart = false
    }, 5000)
  }
}

function startElectron (): void {
  const args = ['--inspect=5858', join(__dirname, './dist/main.js')]
  electronProcess = spawn(String(electron), args)

  electronProcess.stdout.on('data', electronLog)

  electronProcess.stderr.on('data', electronLog)

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog (data: Buffer): void {
  let log: string = ''
  const lineStr = data.toString().split(/\r?\n/)
  lineStr.forEach((line) => {
    if (line.trim() !== '') {
      log += `${line}\n`
    }
  })
  console.log(log)
}

export { dev }
