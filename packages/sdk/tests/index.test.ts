import { expect, test } from 'vitest';
import { MediaGoClient } from '../src';

test('exports MediaGoClient', () => {
  expect(MediaGoClient).toBeInstanceOf(Function);
});
