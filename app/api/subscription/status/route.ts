import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    console.log('🔍 Fetching subscription status...');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription data from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_expiry, interview_minutes_used')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return NextResponse.json(
        { 
          plan: 'free',
          isActive: false,
          expiresAt: null,
          minutesUsed: 0
        }
      );
    }

    // Check if subscription is active
    const currentPlan = profile?.subscription_plan || 'free';
    const expiresAt = profile?.subscription_expiry;
    const isActive = currentPlan !== 'free' && (!expiresAt || new Date(expiresAt) > new Date());

    console.log('✅ Subscription status:', { 
      plan: currentPlan, 
      isActive, 
      expiresAt,
      minutesUsed: profile?.interview_minutes_used || 0
    });

    return NextResponse.json({
      plan: currentPlan,
      isActive,
      expiresAt,
      minutesUsed: profile?.interview_minutes_used || 0
    });
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

// Update minutes used
export async function POST(req: Request) {
  try {
    console.log('⏱️ Updating interview minutes...');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get minutes from request
    const { minutes } = await req.json();
    if (typeof minutes !== 'number' || minutes <= 0) {
      return NextResponse.json(
        { error: 'Invalid minutes value' },
        { status: 400 }
      );
    }

    // Update minutes used
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        interview_minutes_used: minutes
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Minutes update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update minutes' },
        { status: 500 }
      );
    }

    console.log('✅ Minutes updated successfully:', minutes);
    return NextResponse.json({ success: true, minutes });
  } catch (error) {
    console.error('❌ Minutes update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update minutes' },
      { status: 500 }
    );
  }
}
