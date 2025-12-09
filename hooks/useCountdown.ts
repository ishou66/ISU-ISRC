
import { useState, useEffect } from 'react';
import { getTimeRemaining, TimeRemaining } from '../utils/stateMachine';

export const useCountdown = (deadline: string | undefined | null) => {
    const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => 
        getTimeRemaining(deadline || new Date().toISOString())
    );

    useEffect(() => {
        if (!deadline) return;

        // Initial update
        setTimeLeft(getTimeRemaining(deadline));

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining(deadline));
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    return timeLeft;
};
