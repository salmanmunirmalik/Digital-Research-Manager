import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Application, Request, Response, NextFunction } from 'express';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the Vite build output directory.
 * Preferred: dist/client (SPA). Fallback: dist/ (legacy).
 * Runtime compiled server lives at dist/server/server/*.js.
 */
export function resolveFrontendDist(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(__dirname, '../../client'), // dist/client from dist/server/server
    path.resolve(__dirname, '../..'), // legacy dist/
    path.resolve(process.cwd(), 'dist'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

function shouldServeFrontend(): boolean {
  if (process.env.SERVE_FRONTEND === 'false') return false;
  if (process.env.SERVE_FRONTEND === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * Serve the built SPA from Express (DirectAdmin / single-process hosting).
 * Must be registered AFTER all /api routes.
 */
export function mountFrontendStatic(app: Application): boolean {
  if (!shouldServeFrontend()) {
    return false;
  }

  const frontendRoot = resolveFrontendDist();
  if (!frontendRoot) {
    console.warn(
      '⚠️  SERVE_FRONTEND enabled but dist/index.html was not found. Upload a production frontend build.'
    );
    return false;
  }

  app.use(
    express.static(frontendRoot, {
      index: false,
      maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
      etag: true,
    })
  );

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    // Avoid swallowing missing asset 404s that already went through static
    if (path.extname(req.path)) {
      return res.status(404).end();
    }
    return res.sendFile(path.join(frontendRoot, 'index.html'));
  });

  console.log(`🌐 Serving frontend SPA from ${frontendRoot}`);
  return true;
}
