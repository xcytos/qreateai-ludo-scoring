# QreateAI Ludo Scoring System 🎯

**Full Stack Developer Assignment - Real-time Multiplayer Ludo with Advanced Scoring**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.5-orange)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/)
[![Jest](https://img.shields.io/badge/Jest-29-red)](https://jestjs.io/)

> Extended MERN stack multiplayer Ludo game with comprehensive real-time scoring system, safe square mechanics, and full test coverage.
## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/xcytos/qreateai-ludo-scoring.git
cd qreateai-ludo-scoring/repo

# Install dependencies
cd backend && npm install
cd .. && npm install

# Setup environment
cp backend/.env.example backend/.env
# Edit .env with your MongoDB connection string

# Start servers
cd backend && npm start          # Backend on :5000
npm start                        # Frontend on :3000
```

## 📋 My Approach

I extended the existing MERN stack Ludo game with a comprehensive real-time scoring system while maintaining the original game logic integrity. My approach focused on:

###  **Modular Architecture**
- **Separated scoring logic** into `backend/utils/scoring.js` to avoid disrupting core game mechanics
- **Created reusable functions** for different scoring scenarios (progress, captures, totals)
- **Maintained backward compatibility** with existing game state management

### **Real-time Synchronization Strategy**
- **Server-authoritative design** - all scoring calculations happen on the backend to prevent cheating
- **WebSocket integration** via Socket.IO for instant score updates across all connected players
- **Event-driven architecture** - scores update immediately after each move without polling

###  **Test-Driven Development**
- **Implemented comprehensive unit tests** using Jest framework alongside existing Mocha setup
- **Discovered and fixed critical bugs** through testing (safe square logic issue)
- **Achieved 100% function coverage** for all scoring utilities

## ✨ Key Features Implemented

###  **Dual Scoring System**
1. **Progress Points**: Players earn 1 point per step moved (dice value)
2. **Capture Mechanics**: Capturing a pawn transfers victim's total score to attacker
3. **Score Aggregation**: Player's total = sum of all 4 pawn scores
4. **Safe Square Protection**: Pawns on starting positions (16,55,42,29) don't transfer scores when captured

### **Live Scoreboard**
- **Real-time leaderboard** with automatic ranking
- **Strategic positioning** in top-right corner for optimal visibility
- **Crown indicator** for current leader
- **Responsive design** that adapts to mobile screens
- **Color-coded player identification** matching game pieces

### **Performance Optimizations**
- **Efficient Socket.IO events** - only broadcast score changes, not entire game state
- **Modular utility functions** for easy maintenance and testing
- **Server-side calculation caching** to reduce computational overhead

## 🛠️ Technical Implementation

### **Backend Architecture**
```javascript
// Core scoring utilities in backend/utils/scoring.js
ensureScoreFields(room)           // Initialize score tracking
addProgressScore(room, pawnId, steps) // Award movement points
applyCaptureScoring(room, striker, victims) // Handle captures
recomputePlayerTotals(room)      // Calculate final scores
```

### **Frontend Integration**
```jsx
// Real-time score updates in React
const [scoresPayload] = useSocketData('game:scores');
// Automatic UI updates when scores change
```

### **Database Schema Extensions**
```javascript
// Enhanced Pawn model
score: { type: Number, default: 0 }

// Room state additions
playerScores: { type: Object, default: {} }
capturesByPlayer: { type: Object, default: {} }
```

## 🚧 Challenges Overcome

### 🔧 **Technical Challenges**

#### **1. Safe Square Logic Bug**
**Challenge**: Initial implementation used incorrect safe square positions, causing gameplay imbalance
**Solution**: 
- Analyzed game movement logic in `pawn.js` to identify actual starting positions
- Corrected safe squares to game-specific positions: `[16, 55, 42, 29]`
- **Discovery Method**: Unit tests revealed the issue before production

#### **2. Real-time State Synchronization**
**Challenge**: Ensuring all players see identical scores without race conditions
**Solution**:
- Implemented server-authoritative scoring to prevent client-side manipulation
- Used atomic score updates with immediate broadcast to all room participants
- Added validation to prevent duplicate score calculations

#### **3. Integration Without Breaking Core Logic**
**Challenge**: Adding scoring system without disrupting existing Ludo game mechanics
**Solution**:
- Created modular scoring utilities that integrate at specific hook points
- Extended existing models rather than replacing them
- Maintained original Socket.IO event structure while adding new score events

### **UI/UX Challenges**

#### **4. Scoreboard Positioning and Visibility**
**Challenge**: Making scores visible without cluttering the game interface
**Solution**:
- Strategic top-right positioning with fixed layout
- Glass-morphism design that's visible but not intrusive
- Responsive behavior that adapts to different screen sizes

#### **5. Real-time Visual Feedback**
**Challenge**: Providing immediate feedback when scores change
**Solution**:
- Implemented automatic leaderboard reordering
- Added crown indicator for current leader
- Used color-coding to connect scoreboard with game pieces

### 📱 **Performance Challenges**

#### **6. Socket.IO Event Optimization**
**Challenge**: Preventing excessive network traffic from score updates
**Solution**:
- Only emit score changes, not entire game state
- Batched multiple score operations (move + capture) into single broadcast
- Used efficient data structures for score tracking

## 🧪 Testing Strategy

### **Comprehensive Test Coverage**
- **16 Jest unit tests** covering all scoring functions
- **Integration tests** simulating complete game scenarios
- **Edge case testing** for invalid moves and boundary conditions
- **Parameterized testing** using `test.each()` for all safe squares

### **Bug Discovery Process**
1. **Test-First Development** - wrote tests before implementing features
2. **Continuous Testing** - tests caught the safe square logic error
3. **Root Cause Analysis** - traced bug to incorrect position constants
4. **Validation** - confirmed fix with comprehensive test suite

## 🎯 Results Achieved

### **Functional Requirements**
-  **Progress-based scoring** with 1 point per step moved
- **Capture mechanics** with score transfer and victim reset
-  **Real-time synchronization** across all connected players
-  **Live scoreboard** with automatic ranking updates
-  **Safe square protection** preventing unfair score transfers

### **Technical Excellence**
-  **100% test coverage** for all scoring functions
-  **Zero breaking changes** to existing game logic
-  *Professional UI/UX** with responsive design
-  **Modular architecture** for easy maintenance and extension
- **Bug Discovery**: Tests caught critical safe square issue

## Architecture

![Interface](https://github.com/Wenszel/mern-ludo/blob/main/src/images/architecture.png?raw=true)

## Tech Stack

Frontend:

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)

Backend:

![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

Tests:

![cypress](https://img.shields.io/badge/-cypress-%23E5E5E5?style=for-the-badge&logo=cypress&logoColor=058a5e) ![Mocha](https://img.shields.io/badge/-mocha-%238D6748?style=for-the-badge&logo=mocha&logoColor=white) ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

Other:

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white) ![CircleCI](https://img.shields.io/badge/circle%20ci-%23161616.svg?style=for-the-badge&logo=circleci&logoColor=white) ![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white) ![Jira](https://img.shields.io/badge/jira-%230A0FFF.svg?style=for-the-badge&logo=jira&logoColor=white)

## Key Features and Challenges

-   Maintained session consistency with **Express Session** and **MongoDB**.

-   Enabled real-time communication via **WebSocket** and **SocketIO**.

-   Maintained code reliability by implementing unit and integration tests using **Mocha**, **Chai**, and **Jest**.

-   Implemented E2E tests utilizing **Cypress**, addressing challenges related to [testing collaboration](https://docs.cypress.io/guides/references/trade-offs#Multiple-browsers-open-at-the-same-time) and canvas functionality in the application.

-   Established a CI/CD pipeline using **CircleCI**, with pushing **Docker** container to **AWS ECR** and deploying to **AWS ECS**




## Screenshots

![Interface](https://github.com/Wenszel/mern-ludo/blob/main/src/images/readme1.png?raw=true)

![Interface](https://github.com/Wenszel/mern-ludo/blob/main/src/images/lobby.png?raw=true)

![Interface](https://github.com/Wenszel/mern-ludo/blob/main/src/images/winner.png?raw=true)
