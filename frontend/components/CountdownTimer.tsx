'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <div className="text-2xl font-bold text-white font-mono">{timeLeft.days}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Days</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <div className="text-2xl font-bold text-white font-mono">{timeLeft.hours}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Hours</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <div className="text-2xl font-bold text-white font-mono">{timeLeft.minutes}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Mins</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <div className="text-2xl font-bold text-purple-400 font-mono">{timeLeft.seconds}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Secs</div>
            </div>
        </div>
    );
}
