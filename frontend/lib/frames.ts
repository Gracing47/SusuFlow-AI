export interface FrameButton {
    label: string;
    action: 'post' | 'link' | 'mint';
    target?: string;
}

export interface FrameMetadata {
    version: string;
    image: string;
    buttons: FrameButton[];
    postUrl?: string;
}

export interface PoolFrameData {
    poolAddress: string;
    contributionAmount: string;
    tokenSymbol: string;
    memberCount: number;
    maxMembers: number;
    isActive: boolean;
    currentRound: number;
}

export function generatePoolFrameMetadata(
    poolData: PoolFrameData,
    baseUrl: string
): FrameMetadata {
    const imageUrl = `${baseUrl}/api/frames/pool-image?address=${poolData.poolAddress}`;
    const frameUrl = `${baseUrl}/pools/${poolData.poolAddress}`;

    return {
        version: 'vNext',
        image: imageUrl,
        buttons: [
            {
                label: poolData.isActive ? '🔍 View Pool' : '✅ Pool Complete',
                action: 'link',
                target: frameUrl,
            },
            ...(poolData.isActive && poolData.memberCount < poolData.maxMembers
                ? [
                    {
                        label: '🤝 Join Pool',
                        action: 'post' as const,
                        target: `${baseUrl}/api/frames/join`,
                    },
                ]
                : []),
        ],
        postUrl: `${baseUrl}/api/frames/pool?address=${poolData.poolAddress}`,
    };
}

export function generateFrameHtml(metadata: FrameMetadata): string {
    const tags = [
        `<meta property="fc:frame" content="${metadata.version}" />`,
        `<meta property="fc:frame:image" content="${metadata.image}" />`,
        `<meta property="og:image" content="${metadata.image}" />`,
        metadata.postUrl && `<meta property="fc:frame:post_url" content="${metadata.postUrl}" />`,
        ...metadata.buttons.map(
            (button: FrameButton, index: number) => `
            <meta property="fc:frame:button:${index + 1}" content="${button.label}" />
            <meta property="fc:frame:button:${index + 1}:action" content="${button.action}" />
            ${button.target ? `<meta property="fc:frame:button:${index + 1}:target" content="${button.target}" />` : ''}
        `
        ),
    ]
        .filter(Boolean)
        .join('\n');

    return tags;
}
