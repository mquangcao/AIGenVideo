import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

const baseFolder = env.APPDATA !== undefined && env.APPDATA !== '' ? `${env.APPDATA}/ASP.NET/https` : `${env.HOME}/.aspnet/https`;

const certificateName = 'aigenvideo.client';
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
  fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
  if (
    0 !==
    child_process.spawnSync('dotnet', ['dev-certs', 'https', '--export-path', certFilePath, '--format', 'Pem', '--no-password'], {
      stdio: 'inherit',
    }).status
  ) {
    throw new Error('Could not create certificate.');
  }
}

const target = env.ASPNETCORE_HTTPS_PORT
  ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
  : env.ASPNETCORE_URLS
  ? env.ASPNETCORE_URLS.split(';')[0]
  : 'https://localhost:7073';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr({
      exportAsReactComponent: true, // ✅ cái này bạn đã đúng
    }),
    plugin(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@common': fileURLToPath(new URL('./src/common', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '^/api': {
        target,
        secure: false,
      },
    },
    port: parseInt(env.DEV_SERVER_PORT || '50464'),
    https: {
      key: fs.readFileSync(keyFilePath),
      cert: fs.readFileSync(certFilePath),
    },
  },
});
