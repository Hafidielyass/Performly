import { readFileSync } from 'fs';
import { join } from 'path';

let cache: Buffer | null = null;

/** The Patchi mark (rounded square + "P"), used in both the PDF and XLSX exports. */
export function chargerLogoPng(): Buffer {
  if (!cache) {
    cache = readFileSync(join(process.cwd(), 'assets', 'logo.png'));
  }
  return cache;
}
