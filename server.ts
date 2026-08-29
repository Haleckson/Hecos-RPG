import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Server Status & Diagnostics Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    appName: 'Hecos - RPG Campaign & World Codex',
    status: 'online',
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 3. Gemini Content Generation Endpoint (Worldbuilding, NPC Lore, Spells, Perils)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, model = 'gemini-3.7-flash', temperature, responseMimeType } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Campo "prompt" obrigatório e deve ser uma string.' });
    }

    const ai = getGeminiClient();
    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (temperature !== undefined) config.temperature = Number(temperature);
    if (responseMimeType) config.responseMimeType = responseMimeType;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const outputText = response.text || '';
    return res.json({
      success: true,
      text: outputText,
      model,
    });
  } catch (error: any) {
    console.error('Erro na API Gemini /api/gemini/generate:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao processar requisição com a IA do Gemini.',
    });
  }
});

// 4. Gemini Streaming Endpoint (SSE)
app.post('/api/gemini/stream', async (req, res) => {
  try {
    const { prompt, systemInstruction, model = 'gemini-3.7-flash', temperature } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Campo "prompt" obrigatório e deve ser uma string.' });
    }

    const ai = getGeminiClient();
    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (temperature !== undefined) config.temperature = Number(temperature);

    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Erro na API Gemini Streaming /api/gemini/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Erro ao transmitir streaming com a IA.',
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Erro no streaming' })}\n\n`);
      res.end();
    }
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hecos Server] Servidor backend ativo e rodando em http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Hecos Server] Falha crítica ao iniciar servidor:', err);
  process.exit(1);
});
