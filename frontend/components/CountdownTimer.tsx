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
        <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-[#0d111c] rounded-[20px] p-4 border border-white/5">
                <div className="text-3xl font-bold text-white font-mono mb-1">{timeLeft.days}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Days</div>
            </div>
            <div className="bg-[#0d111c] rounded-[20px] p-4 border border-white/5">
                <div className="text-3xl font-bold text-white font-mono mb-1">{timeLeft.hours}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Hours</div>
            </div>
            <div className="bg-[#0d111c] rounded-[20px] p-4 border border-white/5">
                <div className="text-3xl font-bold text-white font-mono mb-1">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mins</div>
            </div>
            <div className="bg-[#0d111c] rounded-[20px] p-4 border border-white/5">
                <div className="text-3xl font-bold text-[#4c82fb] font-mono mb-1">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Secs</div>
            </div>
        </div>
    );
}
