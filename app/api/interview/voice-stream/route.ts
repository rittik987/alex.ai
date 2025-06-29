import { NextRequest, NextResponse } from 'next/server';
import { cleanTextForTTS } from '@/lib/utils/text-processor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 426 });
  }

  return new Response('WebSocket upgrade not supported in this environment', { status: 501 });
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json({ error: 'ElevenLabs API key or voice ID not configured' }, { status: 500 });
    }

    // Clean text for better TTS quality
    const cleanedText = cleanTextForTTS(text);
    console.log('🎵 Original text:', text);
    console.log('🎵 Cleaned text:', cleanedText);

    // Call ElevenLabs TTS API with optimized settings
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: 'eleven_turbo_v2', // Faster model for reduced latency
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        },
        output_format: 'mp3_44100_128' // Optimized format for faster streaming
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ 
      audioData: `data:audio/mpeg;base64,${audioBase64}`,
      success: true 
    });

  } catch (error) {
    console.error('Voice stream API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
