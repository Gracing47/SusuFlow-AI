import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const poolAddress = searchParams.get('address');
    const contributionAmount = searchParams.get('amount') || '0';
    const tokenSymbol = searchParams.get('token') || 'cUSD';
    const memberCount = searchParams.get('members') || '0';
    const maxMembers = searchParams.get('max') || '10';
    const round = searchParams.get('round') || '1';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f0f1e',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #1a1a2e 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a2e 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '40px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '72px',
                        }}
                    >
                        💰
                    </div>
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        SusuFlow
                    </div>
                </div>

                {/* Pool Info Card */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '24px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        width: '80%',
                        maxWidth: '600px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '24px',
                            textAlign: 'center',
                        }}
                    >
                        Pool Round {round}
                    </div>

                    {/* Stats Grid */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            width: '100%',
                            marginBottom: '24px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ fontSize: '20px', color: '#a0a0b0', marginBottom: '8px' }}>
                                Contribution
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                                {contributionAmount} {tokenSymbol}
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ fontSize: '20px', color: '#a0a0b0', marginBottom: '8px' }}>
                                Members
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                                {memberCount}/{maxMembers}
                            </div>
                        </div>
                    </div>

                    {/* Pool Address */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginTop: '16px',
                        }}
                    >
                        <div style={{ fontSize: '16px', color: '#a0a0b0', marginBottom: '8px' }}>
                            Pool Address
                        </div>
                        <div
                            style={{
                                fontSize: '18px',
                                color: '#ffffff',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                            }}
                        >
                            {poolAddress ? `${poolAddress.slice(0, 6)}...${poolAddress.slice(-4)}` : 'Loading...'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        marginTop: '40px',
                        fontSize: '20px',
                        color: '#a0a0b0',
                    }}
                >
                    Powered by Celo 🌱
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
