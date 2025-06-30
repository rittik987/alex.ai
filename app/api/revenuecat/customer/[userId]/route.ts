import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log('🔍 Fetching RevenueCat customer info for user:', userId);

    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
          'X-Platform': 'web',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ RevenueCat API error:', error);
      throw new Error(error.message || 'Failed to fetch customer info');
    }

    const data = await response.json();
    console.log('✅ Customer info retrieved successfully');

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching customer info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer info' },
      { status: 500 }
    );
  }
}
