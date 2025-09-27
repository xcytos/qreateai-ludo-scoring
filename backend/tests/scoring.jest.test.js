const {
  ensureScoreFields,
  addProgressScore,
  applyCaptureScoring,
  recomputePlayerTotals
} = require('../utils/scoring');

describe('Scoring System - Jest Implementation', () => {
  
  // Mock room object factory for consistent testing
  const createMockRoom = () => ({
    players: [
      { _id: 'player1', color: 'red' },
      { _id: 'player2', color: 'blue' },
      { _id: 'player3', color: 'green' },
      { _id: 'player4', color: 'yellow' }
    ],
    pawns: [
      { _id: 'pawn1', color: 'red', position: 20, score: 0 },
      { _id: 'pawn2', color: 'red', position: 25, score: 10 },
      { _id: 'pawn3', color: 'blue', position: 30, score: 15 },
      { _id: 'pawn4', color: 'blue', position: 8, score: 8 },
      { _id: 'pawn5', color: 'green', position: 42, score: 12 },
      { _id: 'pawn6', color: 'yellow', position: 35, score: 5 }
    ],
    playerScores: {},
    capturesByPlayer: {},
    getPawnIndex: function(pawnId) {
      return this.pawns.findIndex(p => p._id === pawnId);
    }
  });

  describe('ensureScoreFields', () => {
    test('initializes missing score tracking fields', () => {
      const room = { players: [{ _id: 'player1' }, { _id: 'player2' }] };
      ensureScoreFields(room);
      
      expect(room.playerScores).toBeDefined();
      expect(room.capturesByPlayer).toBeDefined();
      expect(room.playerScores.player1).toBe(0);
      expect(room.playerScores.player2).toBe(0);
      expect(room.capturesByPlayer.player1).toBe(0);
      expect(room.capturesByPlayer.player2).toBe(0);
    });

    test('preserves existing score values', () => {
      const room = {
        players: [{ _id: 'player1' }],
        playerScores: { player1: 50 },
        capturesByPlayer: { player1: 3 }
      };
      ensureScoreFields(room);
      
      expect(room.playerScores.player1).toBe(50);
      expect(room.capturesByPlayer.player1).toBe(3);
    });
  });

  describe('addProgressScore', () => {
    test('adds movement points to pawn score', () => {
      const room = createMockRoom();
      const pawnId = 'pawn1';
      const stepsMoved = 6;
      
      addProgressScore(room, pawnId, stepsMoved);
      
      expect(room.pawns[0].score).toBe(6);
    });

    test('accumulates progress score correctly', () => {
      const room = createMockRoom();
      room.pawns[1].score = 10; // pawn2 starts with 10
      const pawnId = 'pawn2';
      const stepsMoved = 4;
      
      addProgressScore(room, pawnId, stepsMoved);
      
      expect(room.pawns[1].score).toBe(14);
    });

    test('ignores invalid movement values', () => {
      const room = createMockRoom();
      const pawnId = 'pawn1';
      const initialScore = room.pawns[0].score;
      
      addProgressScore(room, pawnId, 0);
      addProgressScore(room, pawnId, -3);
      
      expect(room.pawns[0].score).toBe(initialScore);
    });
  });

  describe('applyCaptureScoring - Core Logic', () => {
    test('transfers victim score to striker on normal squares', () => {
      const room = createMockRoom();
      const strikerPawnId = 'pawn1';
      const victims = [
        { _id: 'pawn3', position: 30, color: 'blue' } // Normal square
      ];
      
      // Setup: striker has 5, victim has 15
      room.pawns[0].score = 5;  
      room.pawns[2].score = 15; 
      
      applyCaptureScoring(room, strikerPawnId, victims);
      
      expect(room.pawns[0].score).toBe(20); // 5 + 15
      expect(room.pawns[2].score).toBe(0);  // victim reset
    });

    test('CRITICAL: safe square protection prevents score transfer', () => {
      const room = createMockRoom();
      const strikerPawnId = 'pawn1';
      const victims = [
        { _id: 'pawn4', position: 16, color: 'blue' } // Red starting position (safe square)
      ];
      
      room.pawns[0].score = 5;  // striker
      room.pawns[3].score = 12; // victim on safe square
      
      applyCaptureScoring(room, strikerPawnId, victims);
      
      expect(room.pawns[0].score).toBe(5);  // NO score gain
      expect(room.pawns[3].score).toBe(0);  // victim still reset
    });

    test('handles multiple victims with mixed square types', () => {
      const room = createMockRoom();
      const strikerPawnId = 'pawn1';
      const victims = [
        { _id: 'pawn3', position: 30, color: 'blue' },  // Normal
        { _id: 'pawn5', position: 42, color: 'green' },  // Green starting position (safe square)
        { _id: 'pawn6', position: 45, color: 'yellow' } // Normal
      ];
      
      room.pawns[0].score = 10; // striker
      room.pawns[2].score = 20; // normal square victim
      room.pawns[4].score = 15; // safe square victim  
      room.pawns[5].score = 8;  // normal square victim
      
      applyCaptureScoring(room, strikerPawnId, victims);
      
      expect(room.pawns[0].score).toBe(38); // 10 + 20 + 8 (not safe square)
      expect(room.pawns[2].score).toBe(0);  // all victims reset
      expect(room.pawns[4].score).toBe(0);
      expect(room.pawns[5].score).toBe(0);
    });
  });

  describe('applyCaptureScoring - Safe Squares Coverage', () => {
    // Test all safe squares: Red(16), Blue(55), Green(42), Yellow(29)
    const SAFE_SQUARES = [16, 55, 42, 29];
    
    test.each(SAFE_SQUARES)('safe square %i prevents score transfer', (safeSquare) => {
      const room = createMockRoom();
      const strikerPawnId = 'pawn1';
      const victims = [
        { _id: 'pawn3', position: safeSquare, color: 'blue' }
      ];
      
      room.pawns[0].score = 10; // striker
      room.pawns[2].score = 25; // victim on safe square
      
      applyCaptureScoring(room, strikerPawnId, victims);
      
      expect(room.pawns[0].score).toBe(10); // no change
      expect(room.pawns[2].score).toBe(0);  // victim still reset
    });

    test('capture count tracking works correctly', () => {
      const room = createMockRoom();
      ensureScoreFields(room);
      const strikerPawnId = 'pawn1'; // red -> player1
      const victims = [
        { _id: 'pawn3', position: 30, color: 'blue' },  // Normal - counts
        { _id: 'pawn5', position: 42, color: 'green' }   // Green starting position (safe)
      ];
      
      room.pawns[2].score = 10; // normal victim
      room.pawns[4].score = 5;  // safe victim
      
      applyCaptureScoring(room, strikerPawnId, victims);
      
      expect(room.capturesByPlayer.player1).toBe(1); // Only normal square
    });
  });

  describe('recomputePlayerTotals', () => {
    test('correctly sums all pawn scores per player', () => {
      const room = createMockRoom();
      
      // Red player pawns (pawn1, pawn2)
      room.pawns[0].score = 12;
      room.pawns[1].score = 18;
      
      // Blue player pawns (pawn3, pawn4)  
      room.pawns[2].score = 8;
      room.pawns[3].score = 15;
      
      const totals = recomputePlayerTotals(room);
      
      expect(totals.player1).toBe(30); // 12 + 18
      expect(totals.player2).toBe(23); // 8 + 15
      expect(totals.player3).toBe(12); // pawn5 only
      expect(totals.player4).toBe(5);  // pawn6 only
    });

    test('handles edge case with no scored pawns', () => {
      const room = {
        players: [{ _id: 'player1', color: 'red' }],
        pawns: []
      };
      
      const totals = recomputePlayerTotals(room);
      
      expect(totals.player1).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('complete game scenario simulation', () => {
      const room = createMockRoom();
      ensureScoreFields(room);
      
      // Simulate game progression
      addProgressScore(room, 'pawn1', 6); // Red moves 6 steps
      addProgressScore(room, 'pawn3', 4); // Blue moves 4 steps
      
      // Red captures blue on normal square
      room.pawns[2].score = 15; // Set blue score before capture
      applyCaptureScoring(room, 'pawn1', [
        { _id: 'pawn3', position: 25, color: 'blue' }
      ]);
      
      const totals = recomputePlayerTotals(room);
      
      expect(room.pawns[0].score).toBe(21); // 6 + 15 (captured)
      expect(room.pawns[2].score).toBe(0);  // blue reset
      expect(totals.player1).toBe(31);      // 21 + 10 (pawn2)
      expect(room.capturesByPlayer.player1).toBe(1);
    });
  });

});