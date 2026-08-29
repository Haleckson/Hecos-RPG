/**
 * Hecos AI Assistant Service (Server-side proxy client)
 */

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  model?: string;
}

export interface GenerateTextResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Generate AI content via secure backend proxy
 */
export async function generateContentWithAI(options: GenerateTextOptions): Promise<GenerateTextResult> {
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    if (data && data.success) {
      return {
        success: true,
        text: data.text,
      };
    } else {
      return {
        success: false,
        error: data?.error || 'Falha ao gerar conteúdo com a IA.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Erro de conexão com o servidor local.',
    };
  }
}

/**
 * Check backend health & AI availability
 */
export async function checkBackendHealth(): Promise<{ status: string; aiReady: boolean }> {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    return {
      status: data.status || 'offline',
      aiReady: Boolean(data.aiReady),
    };
  } catch {
    return {
      status: 'offline',
      aiReady: false,
    };
  }
}
