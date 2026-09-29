import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const outputDirectory = 'dist';
const files = [];

async function collectFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(path);
    } else {
      files.push(`./${relative(outputDirectory, path).split(sep).join('/')}`);
    }
  }
}

await collectFiles(outputDirectory);
await writeFile(join(outputDirectory, 'manifest.json'), await readFile('manifest.json'));
const indexPath = join(outputDirectory, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');
const updatedIndexHtml = indexHtml.replace(
  /<link rel="manifest" href="[^"]+"/,
  '<link rel="manifest" href="/manifest.json"'
);
if (updatedIndexHtml === indexHtml) {
  throw new Error('No se encontró el enlace al manifiesto web en dist/index.html.');
}
await writeFile(indexPath, updatedIndexHtml);

for (const file of await readdir(join(outputDirectory, 'assets'))) {
  if (/^manifest-.*\.json$/.test(file)) {
    await unlink(join(outputDirectory, 'assets', file));
  }
}

for (let index = files.length - 1; index >= 0; index -= 1) {
  if (/^\.\/assets\/manifest-.*\.json$/.test(files[index])) {
    files.splice(index, 1);
  }
}
files.push('./manifest.json');
const serviceWorker = await readFile('sw.js', 'utf8');
const updatedServiceWorker = serviceWorker.replace(
  /const APP_SHELL = \[[\s\S]*?\];/,
  `const APP_SHELL = ${JSON.stringify(['./', ...files])};`
);

if (updatedServiceWorker === serviceWorker) {
  throw new Error('No se encontró la lista APP_SHELL en sw.js.');
}

await writeFile(join(outputDirectory, 'sw.js'), updatedServiceWorker);
