import * as esbuild from 'esbuild'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'dist', 'v1')
const publicDir = join(root, 'public')

await mkdir(outDir, { recursive: true })
await mkdir(join(root, 'dist'), { recursive: true })
try {
  await copyFile(join(publicDir, 'index.html'), join(root, 'dist', 'index.html'))
} catch {
  console.error('No public/index.html; skipping')
}

const cssDir = join(root, 'src', 'css')
const files = await readdir(cssDir)
for (const f of files) {
  if (f.endsWith('.css')) {
    await copyFile(join(cssDir, f), join(outDir, f))
  }
}

const bundler = {
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
}

await esbuild.build({
  entryPoints: [join(root, 'src', 'm43-analytics.ts')],
  bundle: true,
  outfile: join(outDir, 'm43-analytics.js'),
  ...bundler,
})

await esbuild.build({
  entryPoints: [join(root, 'src', 'm43-auth-header.ts')],
  bundle: true,
  outfile: join(outDir, 'm43-auth-header.js'),
  ...bundler,
})

console.error(`Built to ${outDir}/`)
