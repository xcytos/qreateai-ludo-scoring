import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../App';
import styles from './GameTimer.module.css';

const GameTimer = ({ roomId, gameStarted }) => {
    const socket = useContext(SocketContext);
    const [remainingTime, setRemainingTime] = useState(null);
    const [timerExpired, setTimerExpired] = useState(false);

    useEffect(() => {
        if (!gameStarted || !roomId) {
            setRemainingTime(null);
            return;
        }

        // Request timer info from server
        const requestTimer = () => {
            socket.emit('game:timer-request', roomId);
        };

        requestTimer();
        const interval = setInterval(requestTimer, 1000); // Update every second

        // Listen for timer updates
        const handleTimerUpdate = (data) => {
            setRemainingTime(data.remainingTime);
            if (data.remainingTime <= 0) {
                setTimerExpired(true);
            }
        };
        
        // Listen for timer end event
        const handleTimerEnd = (data) => {
            console.log('GameTimer: Timer ended!', data);
            setTimerExpired(true);
            setRemainingTime(0);
            clearInterval(interval); // Stop requesting updates
        };
        
        socket.on('game:timer-update', handleTimerUpdate);
        socket.on('game:timer-end', handleTimerEnd);

        return () => {
            clearInterval(interval);
            socket.off('game:timer-update', handleTimerUpdate);
            socket.off('game:timer-end', handleTimerEnd);
        };
    }, [socket, roomId, gameStarted]);

    const formatTime = (milliseconds) => {
        if (milliseconds <= 0) return '00:00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!gameStarted || remainingTime === null) {
        return null;
    }

    return (
        <div className={styles.gameTimer}>
            <div className={styles.timerLabel}>Game Time</div>
            <div className={`${styles.timerValue} ${timerExpired ? styles.expired : ''}`}>
                {formatTime(remainingTime)}
            </div>
            {timerExpired && (
                <div className={styles.expiredText}>Time's Up!</div>
            )}
        </div>
    );
};

export default GameTimer;