import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { untrustedData } = body;

        if (!untrustedData) {
            return NextResponse.json({ error: 'Invalid frame data' }, { status: 400 });
        }

        const { fid, buttonIndex } = untrustedData;

        // Here you would:
        // 1. Verify the frame signature
        // 2. Get the user's wallet address from their FID
        // 3. Check if they're verified
        // 4. Prepare the join pool transaction

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://susuflow.netlify.app';

        // For now, redirect to the pool page
        return NextResponse.json({
            version: 'vNext',
            image: `${baseUrl}/api/frames/pool-image?action=join`,
            buttons: [
                {
                    label: '✅ Connect Wallet',
                    action: 'link',
                    target: `${baseUrl}/pools`,
                },
            ],
        });
    } catch (error) {
        console.error('Join frame handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
