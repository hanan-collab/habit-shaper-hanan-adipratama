import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const source = join(process.cwd(), 'src');
const files = (directory: string): string[] => readdirSync(directory).flatMap(name => { const path = join(directory, name); return statSync(path).isDirectory() ? files(path) : [path]; });

test('frontend source never references the retired streak icon', () => {
  const retiredAsset = ['streak', 'svg'].join('.');
  const references = files(source).filter(path => !path.endsWith('assetReferences.test.ts') && /\.(ts|tsx|css)$/.test(path) && readFileSync(path, 'utf8').includes(retiredAsset));
  expect(references).toEqual([]);
});
