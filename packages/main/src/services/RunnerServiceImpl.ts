import { Downloader } from '../core/downloader'
import { spawn, SpawnOptions } from 'child_process'
import { workspace } from '../utils/variables'
import { inject, injectable } from 'inversify'
import { TYPES } from '../types'
// @ts-expect-error
import argsBuilder from 'spawn-args'
import { LoggerService, RunnerService } from '../interfaces'
import { createDownloader } from '../utils'

@injectable()
export default class RunnerServiceImpl implements RunnerService {
  downloader?: Downloader

  constructor (@inject(TYPES.LoggerService) private readonly logger: LoggerService) {}

  setDownloader (downloader: Downloader): void {
    this.downloader = downloader
  }

  async run (options: SpawnOptions): Promise<void> {
    const command = this.downloader?.getBin()
    const args = this.downloader?.getArgs()

    if (!command || !args) throw new Error('请先初始化downloader')
    this.logger.logger.info('下载参数：', options.cwd, command, args)

    return await new Promise((resolve, reject) => {
      const spawnCommand = spawn(command, argsBuilder(args), {
        cwd: workspace,
        detached: true,
        shell: true,
        ...options
      })

      spawnCommand.stdout?.on('data', (data) => {
        const value = data.toString().trim()
        console.log(`stdout: ${value}`)
      })

      spawnCommand.stderr?.on('data', (data) => {
        const value = data.toString().trim()
        console.error(`stderr: ${value}`)
      })

      spawnCommand.on('close', (code) => {
        if (code !== 0) reject(new Error(`调用 ${command} 可执行文件执行失败`))
        else resolve()
      })

      spawnCommand.on('error', (err) => {
        console.error(`err: ${err}`)
      })
    })
  }
}
