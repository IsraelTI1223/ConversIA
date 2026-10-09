export class TtsQueue {
  private queue: string[] = [];
  private speaking = false;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private onSpeakingChange?: (speaking: boolean) => void;
  private cancelled = false;

  constructor(onSpeakingChange?: (speaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  enqueue(sentence: string) {
    if (!sentence.trim()) return;
    this.queue.push(sentence.trim());
    if (!this.speaking) this.processNext();
  }

  private processNext() {
    if (this.cancelled || !this.synth || this.queue.length === 0) {
      this.speaking = false;
      this.onSpeakingChange?.(false);
      return;
    }

    const text = this.queue.shift()!;
    this.speaking = true;
    this.onSpeakingChange?.(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => this.processNext();
    utterance.onerror = () => this.processNext();

    this.synth.speak(utterance);
  }

  cancel() {
    this.cancelled = true;
    this.queue = [];
    this.synth?.cancel();
    this.speaking = false;
    this.onSpeakingChange?.(false);
  }

  reset() {
    this.cancelled = false;
    this.queue = [];
  }
}

export function extractSentences(buffer: string): { sentences: string[]; remaining: string } {
  const sentenceEnds = /([.!?])\s+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceEnds.exec(buffer)) !== null) {
    sentences.push(buffer.slice(lastIndex, match.index + 1));
    lastIndex = match.index + match[0].length;
  }

  return { sentences, remaining: buffer.slice(lastIndex) };
}
