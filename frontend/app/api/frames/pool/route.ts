import { NextRequest, NextResponse } from 'next/server';
import { generatePoolFrameMetadata } from '@/lib/frames';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { untrustedData } = body;

        if (!untrustedData) {
            return NextResponse.json({ error: 'Invalid frame data' }, { status: 400 });
        }

        const poolAddress = new URL(request.url).searchParams.get('address');

        if (!poolAddress) {
            return NextResponse.json({ error: 'Pool address required' }, { status: 400 });
        }

        // Get pool data from blockchain
        // For now, return a simple frame response
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://susuflow.netlify.app';

        const metadata = generatePoolFrameMetadata(
            {
                poolAddress,
                contributionAmount: '10',
                tokenSymbol: 'cUSD',
                memberCount: 3,
                maxMembers: 10,
                isActive: true,
                currentRound: 1,
            },
            baseUrl
        );

        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Frame handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const poolAddress = request.nextUrl.searchParams.get('address');

    if (!poolAddress) {
        return NextResponse.json({ error: 'Pool address required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://susuflow.netlify.app';

    const metadata = generatePoolFrameMetadata(
        {
            poolAddress,
            contributionAmount: '10',
            tokenSymbol: 'cUSD',
            memberCount: 3,
            maxMembers: 10,
            isActive: true,
            currentRound: 1,
        },
        baseUrl
    );

    return NextResponse.json(metadata);
}
