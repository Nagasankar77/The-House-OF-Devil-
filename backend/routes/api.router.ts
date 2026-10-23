import { Router, Request, Response } from 'express';
import { loreService } from '../services/loreService';
import { HealthResponse } from '../../shared/types';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  const healthData: HealthResponse = {
    status: 'ok',
    game: 'The House of Devil',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    hasAiSupport: loreService.hasAiSupport(),
  };
  res.json(healthData);
});

// Dynamic procedural psychological horror lore & whisper generator
apiRouter.post('/horror/lore', async (req: Request, res: Response) => {
  const { context = 'exterior' } = req.body;
  const result = await loreService.generateHorrorWhisper(context);
  res.json(result);
});
