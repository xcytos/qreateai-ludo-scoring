import React from 'react';
import useSocketData from '../../hooks/useSocketData';
import styles from './Scoreboard.module.css';

const COLOR_ORDER = ['red', 'blue', 'green', 'yellow'];

const Scoreboard = ({ players }) => {
    const [scoresPayload] = useSocketData('game:scores');
    const playerScores = scoresPayload?.playerScores || {};
    const capturesByPlayer = scoresPayload?.capturesByPlayer || {};

    // Map colors to playerIds for display ordering
    const colorToPlayerId = {};
    (players || []).forEach(p => {
        if (p && p._id && p.color) {
            colorToPlayerId[p.color] = p._id;
        }
    });

    return (
        <div className={styles.panel} aria-label='Scoreboard'>
            {COLOR_ORDER.map(color => {
                const pid = colorToPlayerId[color];
                const points = pid ? playerScores[pid] || 0 : 0;
                const caps = pid ? capturesByPlayer[pid] || 0 : 0;
                return (
                    <div key={color} className={`${styles.row} ${styles[color]}`}>
                        <span className={styles.name}>{color.toUpperCase()}:</span>
                        <span className={styles.points}>{points} points</span>
                        <span className={styles.captures} title='captures'> (captures: {caps})</span>
                    </div>
                );
            })}
        </div>
    );
};

export default Scoreboard;
