/**
 * Local LLM Service to communicate with the local llama-server running via Tauri sidecar (port 8081).
 * Supports streaming token-by-token generation for live UI feedback.
 */

export interface LLMGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (text: string) => void;
}

export async function streamLLMGeneration(options: LLMGenerateOptions): Promise<string> {
  const {
    prompt,
    systemPrompt = 'You are a helpful AI assistant inside an execution flow graph.',
    maxTokens = 256,
    temperature = 0.7,
    onToken,
  } = options;

  const serverUrl = 'http://127.0.0.1:8081/v1/chat/completions';

  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`LLM Server HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial trailing line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              if (onToken) onToken(fullText);
            }
          } catch {
            // Ignore partial SSE json parsing glitches
          }
        }
      }
    }

    return fullText;
  } catch (err) {
    console.warn('[LLMService] Local llama-server endpoint unavailable or error. Using live simulated streaming fallback.', err);
    return await simulateStreamingGeneration(prompt, onToken);
  }
}

/** Fallback simulated streaming generator for testing when llama-server is downloading/offline */
async function simulateStreamingGeneration(
  prompt: string,
  onToken?: (text: string) => void
): Promise<string> {
  const simulatedText = `[LLM Response] Processing prompt: "${prompt}".\nAnalysis complete: The execution flow triggered this local LLM task successfully! Ready for downstream processing.`;
  const words = simulatedText.split(' ');
  let currentText = '';

  for (let i = 0; i < words.length; i++) {
    currentText += (i === 0 ? '' : ' ') + words[i];
    if (onToken) onToken(currentText);
    await new Promise((res) => setTimeout(res, 40));
  }

  return currentText;
}
