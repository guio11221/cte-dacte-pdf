import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runTsc(projectFile) {
  const tscBin = path.resolve(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
  await execFileAsync(process.execPath, [tscBin, '-p', projectFile], {
    cwd: rootDir
  });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyTemplates(targetRoot) {
  const sourceDir = path.join(rootDir, 'src', 'templates');
  const targetDir = path.join(rootDir, targetRoot, 'src', 'templates');
  await ensureDir(targetDir);

  for (const fileName of await fs.readdir(sourceDir)) {
    await fs.copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName));
  }
}

async function copyStaticExamples(targetRoot) {
  const sourceDir = path.join(rootDir, 'examples');
  const targetDir = path.join(rootDir, targetRoot, 'examples');
  await ensureDir(targetDir);

  for (const fileName of await fs.readdir(sourceDir)) {
    if (!fileName.endsWith('.cjs') && !fileName.endsWith('.mjs') && !fileName.endsWith('.xml')) {
      continue;
    }
    await fs.copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName));
  }
}

async function writePackageJson(targetRoot, type) {
  const targetDir = path.join(rootDir, targetRoot);
  await ensureDir(targetDir);
  await fs.writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify({ type }, null, 2)
  );
}

async function writeCjsEntry() {
  const targetDir = path.join(rootDir, 'dist', 'cjs');
  await ensureDir(targetDir);
  await fs.writeFile(
    path.join(targetDir, 'index.cjs'),
    "module.exports = require('../esm/src/index.js');\n"
  );
}

async function writeBinEntry() {
  const targetDir = path.join(rootDir, 'dist', 'bin');
  await ensureDir(targetDir);
  await fs.writeFile(
    path.join(targetDir, 'cte-pdf.mjs'),
    "#!/usr/bin/env node\nimport { main } from '../esm/src/cli/cte-pdf.js';\nawait main();\n"
  );
}

async function main() {
  await fs.rm(path.join(rootDir, 'dist'), { recursive: true, force: true });

  await runTsc('tsconfig.esm.json');
  await runTsc('tsconfig.types.json');

  await copyTemplates('dist/esm');
  await copyStaticExamples('dist/esm');
  await copyStaticExamples('dist/cjs');
  await writeCjsEntry();
  await writeBinEntry();
  await writePackageJson('dist/esm', 'module');
  await writePackageJson('dist/cjs', 'commonjs');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
