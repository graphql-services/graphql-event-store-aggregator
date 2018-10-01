import { sync } from 'glob';
import { ImportEventCase } from './model';

export const cases: ImportEventCase[] = sync(__dirname + '/*.case.ts').map(
  file => require(file).data,
);
