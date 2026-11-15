import {copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const projectPath = path => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({mode}) => ({
 root: projectPath('./src/'),
 base: './',
 server: {port: 3000},
 build: {
  outDir: projectPath('./dist/'),
  emptyOutDir: true,
  rolldownOptions: {
   input: {
    index: projectPath('./src/index.html'),
    prasna: projectPath('./src/prasna.html')
   }
  }
 },
 plugins: mode === 'owner-private' ? [{
  name: 'owner-private-presets',
  apply: 'build',
  closeBundle() {
   copyFileSync(projectPath('./private/private-presets.json'),projectPath('./dist/private-presets.json'));
  }
 }] : []
}));
