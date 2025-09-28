const mongoose = require('mongoose');
const { COLORS, MOVE_TIME, GAME_TIMER } = require('../utils/constants');
const { makeRandomMove } = require('../handlers/handlersFunctions');
const timeoutManager = require('./timeoutManager.js');
const PawnSchema = require('./pawn');
const PlayerSchema = require('./player');

const RoomSchema = new mongoose.Schema({
    name: String,
    private: { type: Boolean, default: false },
    password: String,
    createDate: { type: Date, default: Date.now },
    started: { type: Boolean, default: false },
    full: { type: Boolean, default: false },
    nextMoveTime: Number,
    rolledNumber: Number,
    // Game timer fields
    gameStartTime: { type: Date, default: null },
    gameEndTime: { type: Date, default: null },
    gameDuration: { type: Number, default: GAME_TIMER },
    players: [PlayerSchema],
    winner: { type: String, default: null },
    winReason: { type: String, default: null }, // 'score', 'traditional', 'timeout'
    // Scoring state maintained at room level
    playerScores: { type: Object, default: {} }, // playerId -> score mapping
    capturesByPlayer: { type: Object, default: {} }, // playerId -> capture count
    pawns: {
        type: [PawnSchema],
        default: () => {
            const startPositions = [];
            for (let i = 0; i < 16; i++) {
                let pawn = {};
                pawn.basePos = i;
                pawn.position = i;
                if (i < 4) pawn.color = COLORS[0];
                else if (i < 8) pawn.color = COLORS[1];
                else if (i < 12) pawn.color = COLORS[2];
                else if (i < 16) pawn.color = COLORS[3];
                startPositions.push(pawn);
            }
            return startPositions;
        },
    },
});

RoomSchema.methods.beatPawns = function (position, attackingPawnColor) {
    // Safe squares where pawns cannot be captured - starting positions for each color
    const SAFE_SQUARES = [16, 55, 42, 29]; // Red, Blue, Green, Yellow starting positions
    
    const pawnsOnPosition = this.pawns.filter(pawn => pawn.position === position);
    const victims = [];
    pawnsOnPosition.forEach(pawn => {
        if (pawn.color !== attackingPawnColor) {
            // Check if pawn is on a safe square - cannot be captured
            if (SAFE_SQUARES.includes(position)) {
                // Pawn is on safe square - skip capture entirely
                return;
            }
            
            const index = this.getPawnIndex(pawn._id);
            victims.push(this.pawns[index]);
            // Send victim back to base (score reset handled by scoring util)
            this.pawns[index].position = this.pawns[index].basePos;
        }
    });
    return victims;
};

RoomSchema.methods.changeMovingPlayer = function () {
    if (this.winner) return;
    const playerIndex = this.players.findIndex(player => player.nowMoving === true);
    this.players[playerIndex].nowMoving = false;
    if (playerIndex + 1 === this.players.length) {
        this.players[0].nowMoving = true;
    } else {
        this.players[playerIndex + 1].nowMoving = true;
    }
    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.rolledNumber = null;
    timeoutManager.clear(this._id.toString());
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
};

RoomSchema.methods.movePawn = function (pawn) {
    const newPositionOfMovedPawn = pawn.getPositionAfterMove(this.rolledNumber);
    this.changePositionOfPawn(pawn, newPositionOfMovedPawn);
    const victims = this.beatPawns(newPositionOfMovedPawn, pawn.color);
    return { newPosition: newPositionOfMovedPawn, victims };
};

RoomSchema.methods.getPawnsThatCanMove = function () {
    const movingPlayer = this.getCurrentlyMovingPlayer();
    const playerPawns = this.getPlayerPawns(movingPlayer.color);
    return playerPawns.filter(pawn => pawn.canMove(this.rolledNumber));
};

RoomSchema.methods.changePositionOfPawn = function (pawn, newPosition) {
    const pawnIndex = this.getPawnIndex(pawn._id);
    this.pawns[pawnIndex].position = newPosition;
};

RoomSchema.methods.canStartGame = function () {
    return this.players.filter(player => player.ready).length >= 2;
};

RoomSchema.methods.startGame = function () {
    this.started = true;
    this.gameStartTime = new Date();
    this.gameEndTime = new Date(Date.now() + this.gameDuration);
    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.players.forEach(player => (player.ready = true));
    this.players[0].nowMoving = true;
    
    // Initialize scoring
    const { ensureScoreFields } = require('../utils/scoring');
    ensureScoreFields(this);
    
    // Set move timeout
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
    // Set game timer
    timeoutManager.set(this.endGameByTimer.bind(this), this.gameDuration, `${this._id.toString()}_game`);
};

// New method: End game when timer expires
RoomSchema.methods.endGameByTimer = async function () {
    if (this.winner) return; // Game already ended
    
    // Ensure scores are calculated
    const { recomputePlayerTotals } = require('../utils/scoring');
    this.playerScores = recomputePlayerTotals(this);
    
    // Determine winner by score
    const winner = this.getWinnerByScore();
    this.endGame(winner, 'timer');
    
    // Save the room first
    await this.save();
    
    // Emit events if socket.io is available
    try {
        const socketManager = require('../socket/socketManager');
        const { sendWinner } = require('../socket/emits');
        
        // Check if socket.io is initialized
        if (socketManager.getIO()) {
            sendWinner(this._id.toString(), winner);
            
            // Also emit timer end event with additional data
            socketManager.getIO().to(this._id.toString()).emit('game:timer-end', {
                winner: winner,
                reason: this.winReason,
                finalScores: this.playerScores,
                captures: this.capturesByPlayer
            });
        }
    } catch (error) {
        // Socket.io not available (e.g., in tests)
        if (process.env.NODE_ENV === 'test' || error.message.includes('not initialized')) {
            console.log('Socket.io not available, skipping emit');
        } else {
            console.error('Error emitting timer end:', error);
        }
    }
};

// Get remaining game time in milliseconds
RoomSchema.methods.getRemainingTime = function () {
    if (!this.gameStartTime || !this.gameEndTime) return null;
    if (this.winner) return 0;
    
    const now = Date.now();
    const endTime = this.gameEndTime.getTime();
    return Math.max(0, endTime - now);
};

RoomSchema.methods.endGame = function (winner, reason = null) {
    timeoutManager.clear(this._id.toString());
    timeoutManager.clear(`${this._id.toString()}_game`);
    this.rolledNumber = null;
    this.nextMoveTime = null;
    this.players.map(player => (player.nowMoving = false));
    this.winner = winner;
    if (reason) {
        this.winReason = reason;
    }
    // Note: save() is called by the caller when needed
};
RoomSchema.methods.getWinner = function () {
    // Check for traditional Ludo win (all 4 pawns home)
    if (this.pawns.filter(pawn => pawn.color === 'red' && pawn.position === 73).length === 4) {
        this.winReason = 'traditional';
        return 'red';
    }
    if (this.pawns.filter(pawn => pawn.color === 'blue' && pawn.position === 79).length === 4) {
        this.winReason = 'traditional';
        return 'blue';
    }
    if (this.pawns.filter(pawn => pawn.color === 'green' && pawn.position === 85).length === 4) {
        this.winReason = 'traditional';
        return 'green';
    }
    if (this.pawns.filter(pawn => pawn.color === 'yellow' && pawn.position === 91).length === 4) {
        this.winReason = 'traditional';
        return 'yellow';
    }
    return null;
};

// New method: Get winner by score (for timer-based ending)
RoomSchema.methods.getWinnerByScore = function () {
    if (!this.playerScores || Object.keys(this.playerScores).length === 0) {
        return null; // No scores available
    }
    
    // Find highest score
    let maxScore = -1;
    let topPlayers = [];
    
    for (const playerId in this.playerScores) {
        const score = this.playerScores[playerId];
        if (score > maxScore) {
            maxScore = score;
            topPlayers = [playerId];
        } else if (score === maxScore) {
            topPlayers.push(playerId);
        }
    }
    
    // If only one player has highest score
    if (topPlayers.length === 1) {
        const player = this.players.find(p => p._id.toString() === topPlayers[0]);
        return player ? player.color : null;
    }
    
    // Tie-breaker: most captures
    if (topPlayers.length > 1 && this.capturesByPlayer) {
        let maxCaptures = -1;
        let tieBreakWinner = null;
        
        topPlayers.forEach(playerId => {
            const captures = this.capturesByPlayer[playerId] || 0;
            if (captures > maxCaptures) {
                maxCaptures = captures;
                tieBreakWinner = playerId;
            }
        });
        
        if (tieBreakWinner) {
            const player = this.players.find(p => p._id.toString() === tieBreakWinner);
            return player ? player.color : null;
        }
    }
    
    // Still tied after captures - return first player
    const player = this.players.find(p => p._id.toString() === topPlayers[0]);
    return player ? player.color : null;
};

RoomSchema.methods.isFull = function () {
    if (this.players.length === 4) {
        this.full = true;
    }
    return this.full;
};

RoomSchema.methods.getPlayer = function (playerId) {
    return this.players.find(player => player._id.toString() === playerId.toString());
};

RoomSchema.methods.addPlayer = function (name, id) {
    if (this.full) return;
    this.players.push({
        sessionID: id,
        name: name,
        ready: false,
        color: COLORS[this.players.length],
    });
};

RoomSchema.methods.getPawnIndex = function (pawnId) {
    return this.pawns.findIndex(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPawn = function (pawnId) {
    return this.pawns.find(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPlayerPawns = function (color) {
    return this.pawns.filter(pawn => pawn.color === color);
};

RoomSchema.methods.getCurrentlyMovingPlayer = function () {
    return this.players.find(player => player.nowMoving === true);
};

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
