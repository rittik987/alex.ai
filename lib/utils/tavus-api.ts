const TAVUS_API_BASE = 'https://tavusapi.com/v2';

interface TavusReplicaResponse {
  replica_id: string;
  replica_name: string;
  thumbnail_video_url: string;
  training_progress: string;
  status: 'completed' | 'training' | 'error';
  created_at: string;
  updated_at: string;
  error_message?: string;
  replica_type: string;
}

interface TavusVideoResponse {
  video_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  hosted_url?: string;
  download_url?: string;
  created_at: string;
}

export async function getReplicaStatus(replicaId: string): Promise<TavusReplicaResponse> {
  const response = await fetch(`${TAVUS_API_BASE}/replicas/${replicaId}`, {
    headers: {
      'x-api-key': process.env.TAVUS_API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get replica status: ${response.status}`);
  }

  return response.json();
}

export async function generateVideo(replicaId: string, script: string, userName: string): Promise<TavusVideoResponse> {
  const response = await fetch(`${TAVUS_API_BASE}/videos`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.TAVUS_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      replica_id: replicaId,
      script,
      video_name: `Welcome_${userName}_${Date.now()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate video: ${response.status}`);
  }

  return response.json();
}

export async function getVideoStatus(videoId: string): Promise<TavusVideoResponse> {
  const response = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
    headers: {
      'x-api-key': process.env.TAVUS_API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get video status: ${response.status}`);
  }

  return response.json();
}
