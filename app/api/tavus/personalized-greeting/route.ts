import { NextRequest, NextResponse } from 'next/server';
import { generateVideo, getVideoStatus, getReplicaStatus } from '@/lib/utils/tavus-api';

export async function POST(request: NextRequest) {
  try {
    const { userName } = await request.json();

    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      );
    }

    const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;

    if (!TAVUS_REPLICA_ID) {
      console.error('Missing Tavus Replica ID');
      return NextResponse.json(
        { error: 'Tavus configuration not found' },
        { status: 500 }
      );
    }

    // First check if replica is ready
    console.log('🔍 Checking replica status...');
    const replicaStatus = await getReplicaStatus(TAVUS_REPLICA_ID);
    
    if (replicaStatus.status !== 'completed') {
      console.error('❌ Replica not ready:', replicaStatus.status);
      return NextResponse.json(
        { error: 'Video generation system not ready' },
        { status: 503 }
      );
    }

    // Create personalized script
    const script = `Hello ${userName}! Welcome to InterviewCracker AI, your personal interview coaching platform. 
I'm Alex, your AI video coach, and I'm here to help you build the confidence and skills you need to ace any interview. 
This platform is designed specifically for ambitious professionals like you who want to excel in their career journey. 
Remember, every expert was once a beginner, and every success story started with preparation. You've taken the first step by joining us, and I believe in your potential to achieve great things.
Let's work together to transform your interview skills and unlock new opportunities. You've got this, ${userName}!
All the best on your journey to success!`;

    console.log('🎬 Generating personalized video for:', userName);

    // Generate video using replica
    const videoData = await generateVideo(TAVUS_REPLICA_ID, script, userName);
    console.log('✅ Video generation started:', videoData);

    // Check initial video status
    const videoStatus = await getVideoStatus(videoData.video_id);
    console.log('📊 Initial video status:', videoStatus);

    return NextResponse.json({
      success: true,
      video_id: videoData.video_id,
      status: videoStatus.status,
      hosted_url: videoStatus.hosted_url,
      message: 'Personalized greeting video generation started'
    });

  } catch (error) {
    console.error('💥 Error generating personalized greeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const videoStatus = await getVideoStatus(videoId);
    console.log('📊 Video status check:', videoStatus);

    return NextResponse.json({
      video_id: videoStatus.video_id,
      status: videoStatus.status,
      hosted_url: videoStatus.hosted_url,
      download_url: videoStatus.download_url,
      created_at: videoStatus.created_at
    });

  } catch (error) {
    console.error('💥 Error getting video status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
