#!/usr/bin/env zx

import { $ } from 'zx'

console.log('开始执行代码质量评估...\n')

await import('./check').catch((out) => {
  throw new Error('代码质量评估失败, 请检查代码')
})

console.log('printf "检测通过, 创建 commit 中...\n')

await $`git add .`
