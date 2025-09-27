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

    // Create sorted leaderboard
    const leaderboard = COLOR_ORDER.map(color => {
        const pid = colorToPlayerId[color];
        const points = pid ? playerScores[pid] || 0 : 0;
        const caps = pid ? capturesByPlayer[pid] || 0 : 0;
        return { color, pid, points, caps };
    }).sort((a, b) => b.points - a.points);

    return (
        <div className={styles.panel} aria-label='Live Scoreboard'>
            <div className={styles.header}>
                <h3 className={styles.title}>🏆 Scoreboard</h3>
            </div>
            
            {leaderboard.map((player, index) => {
                const rankIcon = index === 0 ? '👑' : `${index + 1}.`;
                
                return (
                    <div key={player.color} className={`${styles.row} ${styles[player.color]}`}>
                        <div className={styles.playerInfo}>
                            <span className={styles.rank}>{rankIcon}</span>
                            <span className={styles.name}>{player.color.toUpperCase()}</span>
                        </div>
                        
                        <div className={styles.scoreInfo}>
                            <span className={styles.points}>{player.points} pts</span>
                            <span className={styles.captures}>({player.caps} captures)</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Scoreboard;
