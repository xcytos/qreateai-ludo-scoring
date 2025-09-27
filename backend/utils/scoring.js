// backend/utils/scoring.js
// Modular scoring utilities for progress and capture logic.

function ensureScoreFields(room) {
  if (!room.playerScores || typeof room.playerScores !== 'object') {
    room.playerScores = {};
  }
  if (!room.capturesByPlayer || typeof room.capturesByPlayer !== 'object') {
    room.capturesByPlayer = {};
  }
  // Ensure keys exist for each player
  (room.players || []).forEach((p) => {
    const pid = p._id && p._id.toString();
    if (pid && room.playerScores[pid] == null) room.playerScores[pid] = 0;
    if (pid && room.capturesByPlayer[pid] == null) room.capturesByPlayer[pid] = 0;
  });
}

function addProgressScore(room, pawnId, stepsMoved) {
  if (!stepsMoved || stepsMoved <= 0) return;
  const idx = room.getPawnIndex(pawnId);
  if (idx >= 0) {
    room.pawns[idx].score = (room.pawns[idx].score || 0) + stepsMoved;
  }
}

function getPlayerIdByColor(room, color) {
  const player = (room.players || []).find((p) => p.color === color);
  return player && player._id ? player._id.toString() : null;
}

// Safe starting positions where pawns cannot transfer score on capture
// These are the positions where pawns land when they first exit their base
const SAFE_SQUARES = [16, 55, 42, 29]; // Red, Blue, Green, Yellow starting positions

function isSafeSquare(position, color) {
  // Check if position is one of the safe starting positions
  return SAFE_SQUARES.includes(position);
}

function applyCaptureScoring(room, strikerPawnId, victims) {
  if (!victims || victims.length === 0) return;
  const targetIdx = room.getPawnIndex(strikerPawnId);
  const strikerColor = targetIdx >= 0 ? room.pawns[targetIdx].color : null;
  const strikerPlayerId = strikerColor ? getPlayerIdByColor(room, strikerColor) : null;
  if (strikerPlayerId && room.capturesByPlayer[strikerPlayerId] == null) {
    room.capturesByPlayer[strikerPlayerId] = 0;
  }

  let actualCaptures = 0;
  victims.forEach((victim) => {
    const vIdx = room.getPawnIndex(victim._id);
    const vScore = room.pawns[vIdx].score || 0;
    
    // Check if victim was on a safe square - no score transfer if on safe square
    const isOnSafeSquare = isSafeSquare(victim.position, victim.color);
    
    if (!isOnSafeSquare && vScore > 0 && targetIdx >= 0) {
      // Transfer score only if victim was NOT on safe square
      room.pawns[targetIdx].score = (room.pawns[targetIdx].score || 0) + vScore;
      actualCaptures++;
    }
    // Always reset victim's score (they go back to base regardless)
    room.pawns[vIdx].score = 0;
  });

 
  if (strikerPlayerId && actualCaptures > 0) {
    room.capturesByPlayer[strikerPlayerId] = (room.capturesByPlayer[strikerPlayerId] || 0) + actualCaptures;
  }
}

function recomputePlayerTotals(room) {
  const totals = {};
  (room.players || []).forEach((p) => {
    const pid = p._id && p._id.toString();
    if (pid) totals[pid] = 0;
  });
  (room.pawns || []).forEach((pawn) => {
    const pid = getPlayerIdByColor(room, pawn.color);
    if (pid != null) {
      totals[pid] = (totals[pid] || 0) + (pawn.score || 0);
    }
  });
  return totals;
}

module.exports = {
  ensureScoreFields,
  addProgressScore,
  applyCaptureScoring,
  recomputePlayerTotals,
};
