const mongoose = require('mongoose');
const Room = require('../models/room');
const { recomputePlayerTotals } = require('../utils/scoring');

describe('Timer-based Game Ending and Score-based Winner Tests', () => {
    let room;

    beforeEach(async () => {
        // Create a test room with basic setup
        room = new Room({
            name: 'Test Room',
            gameDuration: 300000, // 5 minutes
            playerScores: [],
            capturesByPlayer: {},
            players: [
                { name: 'Player1', color: 'red', ready: true, nowMoving: true },
                { name: 'Player2', color: 'blue', ready: true, nowMoving: false },
                { name: 'Player3', color: 'green', ready: true, nowMoving: false },
                { name: 'Player4', color: 'yellow', ready: true, nowMoving: false }
            ],
            pawns: [
                // Red pawns
                { color: 'red', position: 10, pawnNumber: 0 },
                { color: 'red', position: 15, pawnNumber: 1 },
                { color: 'red', position: 20, pawnNumber: 2 },
                { color: 'red', position: 25, pawnNumber: 3 },
                // Blue pawns
                { color: 'blue', position: 30, pawnNumber: 0 },
                { color: 'blue', position: 35, pawnNumber: 1 },
                { color: 'blue', position: 40, pawnNumber: 2 },
                { color: 'blue', position: 45, pawnNumber: 3 },
                // Green pawns
                { color: 'green', position: 5, pawnNumber: 0 },
                { color: 'green', position: 8, pawnNumber: 1 },
                { color: 'green', position: 12, pawnNumber: 2 },
                { color: 'green', position: 18, pawnNumber: 3 },
                // Yellow pawns
                { color: 'yellow', position: 2, pawnNumber: 0 },
                { color: 'yellow', position: 4, pawnNumber: 1 },
                { color: 'yellow', position: 6, pawnNumber: 2 },
                { color: 'yellow', position: 7, pawnNumber: 3 }
            ]
        });
    });

    describe('Timer Functionality', () => {
        test('getRemainingTime returns correct time before game starts', () => {
            const remainingTime = room.getRemainingTime();
            expect(remainingTime).toBeNull();
        });

        test('getRemainingTime returns correct time after game starts', () => {
            room.startGame();
            const remainingTime = room.getRemainingTime();
            expect(remainingTime).toBeLessThanOrEqual(room.gameDuration);
            expect(remainingTime).toBeGreaterThan(0);
        });

        test('getRemainingTime returns 0 when game has winner', () => {
            room.startGame();
            room.winner = 'red';
            const remainingTime = room.getRemainingTime();
            expect(remainingTime).toBe(0);
        });

        test('startGame sets correct timer values', () => {
            const beforeStart = Date.now();
            room.startGame();
            const afterStart = Date.now();

            expect(room.gameStartTime).toBeInstanceOf(Date);
            expect(room.gameEndTime).toBeInstanceOf(Date);
            expect(room.gameStartTime.getTime()).toBeGreaterThanOrEqual(beforeStart);
            expect(room.gameStartTime.getTime()).toBeLessThanOrEqual(afterStart);
            expect(room.gameEndTime.getTime()).toBe(room.gameStartTime.getTime() + room.gameDuration);
        });

        test('endGameByTimer does not end if game already has winner', () => {
            room.winner = 'red';
            room.winReason = 'traditional';
            const originalWinner = room.winner;
            const originalReason = room.winReason;

            room.endGameByTimer();

            expect(room.winner).toBe(originalWinner);
            expect(room.winReason).toBe(originalReason);
        });
    });

    describe('Score-based Winner Determination', () => {
        test('getWinnerByScore returns null when no scores available', () => {
            room.playerScores = [];
            const winner = room.getWinnerByScore();
            expect(winner).toBeNull();
        });

        test('getWinnerByScore returns clear winner by score', () => {
            room.playerScores = [
                { color: 'red', total: 100 },
                { color: 'blue', total: 80 },
                { color: 'green', total: 60 },
                { color: 'yellow', total: 40 }
            ];

            const winner = room.getWinnerByScore();
            expect(winner).toBe('red');
        });

        test('getWinnerByScore handles tie with capture tie-breaker', () => {
            room.playerScores = [
                { color: 'red', total: 100 },
                { color: 'blue', total: 100 },
                { color: 'green', total: 60 },
                { color: 'yellow', total: 40 }
            ];
            room.capturesByPlayer = {
                red: 3,
                blue: 5,
                green: 1,
                yellow: 0
            };

            const winner = room.getWinnerByScore();
            expect(winner).toBe('blue'); // Blue has more captures
        });

        test('getWinnerByScore handles complete tie (same score and captures)', () => {
            room.playerScores = [
                { color: 'red', total: 100 },
                { color: 'blue', total: 100 },
                { color: 'green', total: 60 },
                { color: 'yellow', total: 40 }
            ];
            room.capturesByPlayer = {
                red: 3,
                blue: 3,
                green: 1,
                yellow: 0
            };

            const winner = room.getWinnerByScore();
            expect(['red', 'blue']).toContain(winner); // Should be one of the tied players
        });

        test('getWinnerByScore handles missing capture data', () => {
            room.playerScores = [
                { color: 'red', total: 100 },
                { color: 'blue', total: 100 },
                { color: 'green', total: 60 },
                { color: 'yellow', total: 40 }
            ];
            room.capturesByPlayer = null;

            const winner = room.getWinnerByScore();
            expect(['red', 'blue']).toContain(winner);
        });
    });

    describe('Traditional vs Timer-based Winner Logic', () => {
        test('getWinner returns traditional winner when all pawns home', () => {
            // Set red player to have all pawns at home position
            room.pawns = room.pawns.map(pawn => 
                pawn.color === 'red' ? { ...pawn, position: 73 } : pawn
            );

            const winner = room.getWinner();
            expect(winner).toBe('red');
        });

        test('getWinner uses score-based logic when winReason is timer', () => {
            room.winReason = 'timer';
            room.playerScores = [
                { color: 'red', total: 80 },
                { color: 'blue', total: 100 },
                { color: 'green', total: 60 },
                { color: 'yellow', total: 40 }
            ];

            const winner = room.getWinner();
            expect(winner).toBe('blue');
        });

        test('getWinner returns null when no traditional winner and not timer-based', () => {
            const winner = room.getWinner();
            expect(winner).toBeNull();
        });
    });

    describe('Integration Tests', () => {
        test('endGameByTimer calculates scores and determines winner correctly', () => {
            // Mock scoring calculation
            room.playerScores = recomputePlayerTotals(room);
            room.capturesByPlayer = {
                red: 2,
                blue: 1,
                green: 3,
                yellow: 0
            };

            // Simulate timer expiration
            room.endGameByTimer();

            expect(room.winner).toBeDefined();
            expect(room.winReason).toBe('timer');
            expect(room.playerScores).toBeDefined();
            expect(room.playerScores.length).toBeGreaterThan(0);
        });

        test('endGame method accepts and sets win reason', () => {
            const winner = 'red';
            const reason = 'timer';

            room.endGame(winner, reason);

            expect(room.winner).toBe(winner);
            expect(room.winReason).toBe(reason);
        });

        test('Timer expiration workflow is complete', () => {
            room.startGame();
            
            // Simulate some game progress
            room.playerScores = [
                { color: 'red', total: 50 },
                { color: 'blue', total: 75 },
                { color: 'green', total: 30 },
                { color: 'yellow', total: 20 }
            ];
            room.capturesByPlayer = {
                red: 1,
                blue: 2,
                green: 0,
                yellow: 1
            };

            // Simulate timer expiration
            room.endGameByTimer();

            expect(room.winner).toBe('blue'); // Highest score
            expect(room.winReason).toBe('timer');
        });
    });

    describe('Edge Cases', () => {
        test('handles empty player scores gracefully', () => {
            room.playerScores = [];
            const winner = room.getWinnerByScore();
            expect(winner).toBeNull();
        });

        test('handles single player scenario', () => {
            room.playerScores = [
                { color: 'red', total: 100 }
            ];

            const winner = room.getWinnerByScore();
            expect(winner).toBe('red');
        });

        test('handles zero scores correctly', () => {
            room.playerScores = [
                { color: 'red', total: 0 },
                { color: 'blue', total: 0 },
                { color: 'green', total: 0 },
                { color: 'yellow', total: 0 }
            ];

            const winner = room.getWinnerByScore();
            expect(['red', 'blue', 'green', 'yellow']).toContain(winner);
        });

        test('handles negative scores correctly', () => {
            room.playerScores = [
                { color: 'red', total: -10 },
                { color: 'blue', total: 5 },
                { color: 'green', total: -20 },
                { color: 'yellow', total: 0 }
            ];

            const winner = room.getWinnerByScore();
            expect(winner).toBe('blue');
        });
    });
});