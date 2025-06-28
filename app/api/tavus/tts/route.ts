import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const tavusApiKey = process.env.TAVUS_API_KEY;
    const tavusReplicaId = process.env.TAVUS_REPLICA_ID;

    if (!tavusApiKey || !tavusReplicaId) {
      return NextResponse.json({ error: 'Tavus API key or Replica ID not configured' }, { status: 500 });
    }

    // Updated Tavus API endpoint and request format
    const apiUrl = 'https://tavusapi.com/v2/videos';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey
      },
      body: JSON.stringify({
        replica_id: tavusReplicaId,
        script: text,
        video_name: 'Interview Response'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus TTS API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    const data = await response.json();

    // Return the video URL to the frontend
    return NextResponse.json({ videoUrl: data.video_url || data.videoUrl || null });

  } catch (error) {
    console.error('Tavus TTS API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
