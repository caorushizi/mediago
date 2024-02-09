import { ProcessOutput } from 'zx/core'

export function printObject(
  object: Record<string, unknown> | ProcessOutput,
  method: 'log' | 'warn' | 'error' = 'log'
) {
  for (const [key, value] of Object.entries(object)) {
    // eslint-disable-next-line no-console
    console[method](`${key}:\n${value}\n`)
  }
}
