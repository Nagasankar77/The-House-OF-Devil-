import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('[Server] Could not initialize GoogleGenAI client:', err);
  }
}

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    game: 'The House of Devil',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    hasAiSupport: Boolean(aiClient),
  });
});

// Dynamic procedural psychological horror lore & whisper generator (Gemini 2.5 Flash)
app.post('/api/horror/lore', async (req: Request, res: Response) => {
  try {
    const { context = 'exterior' } = req.body;

    if (!aiClient) {
      // Atmospheric procedural fallback when API key is not configured
      const fallbacks: Record<string, string[]> = {
        gate: [
          'The chains remember whose hands fastened them in the winter of 1952.',
          'Two flames have burned down. The third sleeps in cold stone.',
          'Turn back before the hinges scream.',
        ],
        exterior: [
          'The mud will swallow the footsteps you leave behind.',
          'Yamini was never allowed past the colonial balustrade.',
          'Look into the trees... something matches your stride.',
        ],
        bungalow: [
          'The clock stopped at 3:17 for a reason.',
          'Do not look directly into the vanity mirror upstairs.',
          'She waits at the top of the grand stairs.',
        ],
      };
      const list = fallbacks[context] || fallbacks.exterior;
      const whisper = list[Math.floor(Math.random() * list.length)];
      return res.json({ whisper, source: 'procedural' });
    }

    const prompt = `You are the haunting psychological entity residing inside The House of Devil (an abandoned 1950s British colonial estate in Kakinada).
Generate one terrifying, cryptic, slow psychological horror phrase (10-20 words maximum) overheard as an eerie wind whisper by the protagonist Sankar exploring the grounds at ${context}.
Do not use cheap clichés, exclamation marks, or gore. Ground it in cold reality, abandoned memories, and Yamini. Output only the whisper text.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const whisper = response.text?.trim() || 'She is still waiting in the dark...';
    return res.json({ whisper, source: 'ai' });
  } catch (err: any) {
    console.error('[API Horror Lore Error]:', err);
    return res.status(500).json({
      error: 'Failed to generate horror whisper',
      fallback: 'The silence watches you.',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[The House of Devil Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
