import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths relative to this file's location for Vercel compatibility
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const SERVER_DIST_DIR = path.join(ROOT, 'dist', 'server');
const CLIENT_INDEX_HTML = path.join(DIST_DIR, 'index.html');

async function createServer() {
  const app = express();
  let vite;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: ROOT,
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets from the root dist directory in production
    app.use(express.static(DIST_DIR, { index: false }));
  }

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = isProduction
        ? fs.readFileSync(CLIENT_INDEX_HTML, 'utf-8')
        : fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

      let render;
      if (isProduction) {
        // The server bundle is at dist/server/entry-server.js
        const serverEntryPath = path.join(SERVER_DIST_DIR, 'entry-server.js');
        ({ render } = await import(serverEntryPath));
      } else {
        template = await vite.transformIndexHtml(url, template);
        ({ render } = await vite.ssrLoadModule('/src/entry-server.jsx'));
      }

      const { html: appHtml, helmet } = await render(url);

      const headHtml = [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ].join('');
      
      // Replace the correct placeholders
      const finalHtml = template
        .replace(``, headHtml) // Using my previous placeholders for compatibility
        .replace(``, appHtml);

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml);
    } catch (e) {
      if (vite?.ssrFixStacktrace) vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  return app;
}

const app = await createServer();
export default app;