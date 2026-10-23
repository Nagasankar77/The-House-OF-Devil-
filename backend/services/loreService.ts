import { GoogleGenAI } from '@google/genai';
import { HORROR_FALLBACK_WHISPERS } from '../../shared/constants';
import { HorrorLoreResponse } from '../../shared/types';

export class LoreService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.warn('[LoreService] Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  public hasAiSupport(): boolean {
    return Boolean(this.aiClient);
  }

  public async generateHorrorWhisper(context: string = 'exterior'): Promise<HorrorLoreResponse> {
    if (!this.aiClient) {
      const list = HORROR_FALLBACK_WHISPERS[context] || HORROR_FALLBACK_WHISPERS.exterior;
      const whisper = list[Math.floor(Math.random() * list.length)];
      return { whisper, source: 'procedural' };
    }

    try {
      const prompt = `You are the haunting psychological entity residing inside The House of Devil (an abandoned 1950s British colonial estate in Kakinada).
Generate one terrifying, cryptic, slow psychological horror phrase (10-20 words maximum) overheard as an eerie wind whisper by the protagonist exploring the grounds at ${context}.
Do not use cheap clichés, exclamation marks, or gore. Ground it in cold reality, abandoned memories, and the girl who vanished. Output only the whisper text.`;

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const whisper = response.text?.trim() || 'She is still waiting in the dark...';
      return { whisper, source: 'ai' };
    } catch (err: any) {
      console.error('[LoreService Error]:', err);
      const list = HORROR_FALLBACK_WHISPERS[context] || HORROR_FALLBACK_WHISPERS.exterior;
      const fallbackWhisper = list[Math.floor(Math.random() * list.length)] || 'The silence watches you.';
      return { whisper: fallbackWhisper, source: 'procedural', error: err?.message };
    }
  }
}

export const loreService = new LoreService();
