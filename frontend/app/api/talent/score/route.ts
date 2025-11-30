import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.TALENT_API_KEY;

    if (!apiKey) {
        // Return a mock score if no API key is configured (for demo purposes)
        // This allows the UI to show something even without the key
        return NextResponse.json({ score: 0, isMock: true });
    }

    try {
        // Using the /score endpoint to get the aggregate score
        const response = await fetch(`https://api.talentprotocol.com/score?id=${address}`, {
            headers: {
                'X-API-KEY': apiKey
            }
        });

        if (!response.ok) {
            // If 404, it means the user has no profile/score yet
            if (response.status === 404) {
                return NextResponse.json({ score: 0 });
            }
            throw new Error(`Talent Protocol API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching Talent Score:', error);
        return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 });
    }
}
