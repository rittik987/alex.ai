import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 426 });
  }

  // For Next.js API routes, we need to handle WebSocket differently
  // This is a simplified approach for demonstration
  return new Response('WebSocket upgrade not supported in this environment', { status: 501 });
}

// Alternative HTTP-based streaming approach
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json({ error: 'ElevenLabs API key or voice ID not configured' }, { status: 500 });
    }

    // Call ElevenLabs TTS API directly
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
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
