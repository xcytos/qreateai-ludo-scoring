const { sendToPlayersRolledNumber, sendWinner, sendScores } = require('../socket/emits');

const rollDice = () => {
    const rolledNumber = Math.ceil(Math.random() * 6);
    return rolledNumber;
};

const makeRandomMove = async roomId => {
    const { updateRoom, getRoom } = require('../services/roomService');
    const room = await getRoom(roomId);
    if (room.winner) return;
    if (room.rolledNumber === null) {
        room.rolledNumber = rollDice();
        sendToPlayersRolledNumber(room._id.toString(), room.rolledNumber);
    }

    const pawnsThatCanMove = room.getPawnsThatCanMove();
    if (pawnsThatCanMove.length > 0) {
        const randomPawn = pawnsThatCanMove[Math.floor(Math.random() * pawnsThatCanMove.length)];
        // Move pawn and apply scoring
        const { victims } = room.movePawn(randomPawn);
        const { ensureScoreFields, addProgressScore, applyCaptureScoring, recomputePlayerTotals } = require('../utils/scoring');
        ensureScoreFields(room);
        const stepsMoved = room.rolledNumber;
        addProgressScore(room, randomPawn._id, stepsMoved);
        applyCaptureScoring(room, randomPawn._id, victims);
        room.playerScores = recomputePlayerTotals(room);
    }
    room.changeMovingPlayer();
    const winner = room.getWinner();
    if (winner) {
        room.endGame(winner);
        sendWinner(room._id.toString(), winner);
    }
    await updateRoom(room);
    // Emit updated scores to room
    sendScores(room._id.toString(), { playerScores: room.playerScores, capturesByPlayer: room.capturesByPlayer || {} });
};

const isMoveValid = (session, pawn, room) => {
    if (session.color !== pawn.color) {
        return false;
    }
    if (session.playerId !== room.getCurrentlyMovingPlayer()._id.toString()) {
        return false;
    }
    return true;
};

module.exports = { rollDice, makeRandomMove, isMoveValid };
