/**
 * Audio streaming and processing utilities
 */

export class AudioStreamHandler {
  private audioContext: AudioContext;
  private sourceNode?: AudioBufferSourceNode;
  private gainNode: GainNode;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  /**
   * Process incoming audio chunks and add to queue
   */
  async processAudioChunk(chunk: ArrayBuffer) {
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(chunk);
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextChunk();
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  /**
   * Play the next chunk in the queue
   */
  private playNextChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.audioQueue.shift()!;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    
    source.onended = () => {
      this.playNextChunk();
    };

    source.start(0);
    this.sourceNode = source;
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.audioContext.close();
  }
}

/**
 * Create a readable stream from response
 */
export async function* streamAudioResponse(response: Response) {
  const reader = response.body!.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield value;
  }
}

/**
 * Convert stream to audio chunks
 */
export async function processAudioStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: ArrayBuffer) => Promise<void>
) {
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert Uint8Array to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(value.byteLength);
      const uint8View = new Uint8Array(arrayBuffer);
      uint8View.set(value);
      
      // Process the chunk
      await onChunk(arrayBuffer);
    }
  } finally {
    reader.releaseLock();
  }
}
