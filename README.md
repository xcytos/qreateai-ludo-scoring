# QreateAI Ludo Scoring System 🎯

**Full Stack Developer Assignment - Real-time Multiplayer Ludo with Advanced Scoring**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.5-orange)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/)
[![Jest](https://img.shields.io/badge/Jest-29-red)](https://jestjs.io/)

> Extended MERN stack multiplayer Ludo game with comprehensive real-time scoring system, safe square mechanics, and full test coverage.

## Quick Start

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

## 🎯Scoring System Features

###Real-time Score Updates
- **Instant feedback** via WebSocket communication
- **Live leaderboard** with dynamic rankings  
- **Progress tracking** for each player's advancement

### Dual Scoring Mechanics
1. **Progress Points**: 1 point per step moved on board
2. **Capture Bonuses**: Transfer victim's total score to attacker
3. **Safe Square Protection**: Starting positions prevent unfair captures

### Safe Square Logic (Critical Fix)
```javascript
// Corrected safe starting positions
const SAFE_SQUARES = [16, 55, 42, 29]; // Red, Blue, Green, Yellow
```

### 🧪 Comprehensive Testing
- **16 Unit Tests** with Jest framework
- **100% Function Coverage** for scoring system
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
