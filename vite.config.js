import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// Stamp the commit into the page so a live check can prove which build is served.
const sha = process.env.VERCEL_GIT_COMMIT_SHA || (() => { try { return execSync('git rev-parse HEAD').toString().trim(); } catch { return 'unknown'; } })();
const stamp = { name: 'build-sha', transformIndexHtml: (html) => html.replace('<html lang="en">', `<html lang="en" data-build-sha="${sha}">`) };

export default defineConfig({ plugins: [react(), stamp], test: { include: ['tests/**/*.test.js'] } });
