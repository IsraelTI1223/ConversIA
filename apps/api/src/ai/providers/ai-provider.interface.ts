export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiOptions {
  temperature: number;
  maxTokens: number;
}

export interface AiProvider {
  chat(
    system: string,
    messages: AiMessage[],
    options: AiOptions,
  ): Promise<string>;

  chatStream(
    system: string,
    messages: AiMessage[],
    options: AiOptions,
  ): AsyncGenerator<string, void, unknown>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
