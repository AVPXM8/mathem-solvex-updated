import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const isProduction = process.env.NODE_ENV === 'production';
// Get the root directory of the project, which is /var/task on Vercel
const root = process.cwd(); 

async function createServer() {
  const app = express();
  let vite;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root, // Tell Vite where the project root is
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets from the included 'dist/client' folder
    app.use(express.static(path.resolve(root, 'dist/client'), { index: false }));
  }

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      // Correctly locate the index.html template in both dev and prod
      const templatePath = isProduction 
        ? path.resolve(root, 'dist/client/index.html')
        : path.resolve(root, 'index.html');
      
      let template = fs.readFileSync(templatePath, 'utf-8');

      let render;
      if (isProduction) {
        // Correctly import the pre-built server entry file
        const serverEntryPath = path.resolve(root, 'dist/server/entry-server.js');
        ({ render } = await import(serverEntryPath));
      } else {
        template = await vite.transformIndexHtml(url, template);
        ({ render } = await vite.ssrLoadModule('/src/entry-server.jsx'));
      }

      const { html: appHtml, helmet } = render(url);
      
      const headHtml = [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ].join('');

      template = template.replace(``, headHtml);
      template = template.replace(``, appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  return app;
}

// Vercel exports the app instance directly
export default createServer();