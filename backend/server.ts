import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.router';
import { requestLogger, errorHandler } from './middleware';
import { getServerPort } from './utils';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
const PORT = getServerPort();
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(requestLogger);

// Mount API routes
app.use('/api', apiRouter);

// Static audio and assets directory serving
const publicAudioPath = path.resolve(projectRoot, 'public/audio');
const publicAssetsPath = path.resolve(projectRoot, 'public/assets');

app.use('/audio', express.static(publicAudioPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mpeg') || filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  },
}));

app.use('/assets', express.static(publicAssetsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mpeg') || filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  },
}));

// Setup Vite middleware in dev or static serving in production
export async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: projectRoot,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  return new Promise((resolve) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[The House of Devil Server] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Auto-start if executed directly
if (process.argv[1] === __filename) {
  startServer();
}

export default app;
