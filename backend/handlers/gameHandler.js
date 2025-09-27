const { getRoom, updateRoom } = require('../services/roomService');
const { sendToPlayersRolledNumber, sendWinner, sendScores } = require('../socket/emits');
const { rollDice, isMoveValid } = require('./handlersFunctions');
const { ensureScoreFields, addProgressScore, applyCaptureScoring, recomputePlayerTotals } = require('../utils/scoring');

module.exports = socket => {
    const req = socket.request;

    const handleMovePawn = async pawnId => {
        const room = await getRoom(req.session.roomId);
        if (room.winner) return;
        const pawn = room.getPawn(pawnId);
        if (isMoveValid(req.session, pawn, room)) {
            ensureScoreFields(room);
            const stepsMoved = room.rolledNumber;
            // Move pawn
            const newPositionOfMovedPawn = pawn.getPositionAfterMove(room.rolledNumber);
            room.changePositionOfPawn(pawn, newPositionOfMovedPawn);
            // Progress-based scoring
            addProgressScore(room, pawn._id, stepsMoved);
            // Capture scoring
            const victims = room.beatPawns(newPositionOfMovedPawn, req.session.color);
            applyCaptureScoring(room, pawn._id, victims);
            // Recompute player totals for emit
            room.playerScores = recomputePlayerTotals(room);

            room.changeMovingPlayer();
            const winner = room.getWinner();
            if (winner) {
                room.endGame(winner);
                sendWinner(room._id.toString(), winner);
            }
            await updateRoom(room);
            // Emit updated scores to all players in the room
            sendScores(room._id.toString(), { playerScores: room.playerScores, capturesByPlayer: room.capturesByPlayer || {} });
        }
    };

    const handleRollDice = async () => {
        const rolledNumber = rollDice();
        sendToPlayersRolledNumber(req.session.roomId, rolledNumber);
        const room = await updateRoom({ _id: req.session.roomId, rolledNumber: rolledNumber });
        const player = room.getPlayer(req.session.playerId);
        if (!player.canMove(room, rolledNumber)) {
            room.changeMovingPlayer();
            await updateRoom(room);
        }
    };

    socket.on('game:roll', handleRollDice);
    socket.on('game:move', handleMovePawn);
};
