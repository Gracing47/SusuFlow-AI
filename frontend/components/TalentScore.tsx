'use client';

import { useEffect, useState } from 'react';

interface TalentScoreProps {
    address: string;
    className?: string;
}

export function TalentScore({ address, className = '' }: TalentScoreProps) {
    const [score, setScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) return;

        async function fetchScore() {
            setLoading(true);
            try {
                const res = await fetch(`/api/talent/score?address=${address}`);
                const data = await res.json();

                // Assuming the API returns { score: number } or similar
                // Adjust based on actual API response structure
                if (data.score !== undefined) {
                    setScore(data.score);
                } else if (typeof data === 'number') {
                    setScore(data);
                }
            } catch (e) {
                console.error('Failed to load Talent Score', e);
            } finally {
                setLoading(false);
            }
        }

        fetchScore();
    }, [address]);

    if (loading) return <div className={`animate-pulse h-6 w-16 bg-white/10 rounded ${className}`} />;

    // Don't show anything if score is 0 or null (optional, maybe show 0?)
    if (score === null) return null;

    return (
        <a
            href={`https://app.talentprotocol.com/profile/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 hover:bg-[#7C3AED]/20 transition-all group ${className}`}
            title="Talent Protocol Builder Score"
        >
            <span className="text-xs font-medium text-[#7C3AED] group-hover:text-[#8B5CF6]">Builder Score</span>
            <span className="text-sm font-bold text-white">{score}</span>
        </a>
    );
}
