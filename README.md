# SusuFlow-AI 🌊💰
**Decentralized Rotating Savings and Credit Association (ROSCA) on Celo**

> **Built for Proof of Ship 10 Hackathon** 🚢
> **LIVE ON MAINNET**: [https://susuflow.netlify.app](https://susuflow.netlify.app)

SusuFlow-AI brings the traditional "Susu" savings circle onto the blockchain, making it transparent, automated, and secure. By leveraging the Celo blockchain, AI agents, and identity verification, we create trusted financial communities without borders.

## 🏆 Hackathon Tracks

We are proudly building for the following tracks:

*   **🤖 NoahAI Track**: We utilize a NoahAI agent (`agent/src/poolMonitor.ts`) to autonomously monitor pools and trigger payout distributions when conditions are met, ensuring the savings circle keeps flowing without manual intervention.
*   **🔐 Self Track**: We integrated Self Protocol (`frontend/app/verify/page.tsx`) to verify the identity of pool creators, adding a crucial layer of trust and Sybil resistance to our ROSCA pools.
*   **🛠️ Thirdweb Track**: Our entire frontend is powered by Thirdweb (`thirdweb/react`) for seamless wallet connection, smart contract interactions, and chain management.
*   **🎭 Farcaster / Social Track**: We implemented **Farcaster Frames** (`frontend/lib/frames.ts`) allowing users to view pool stats and join directly from their social feed.
*   **⭐ Talent Protocol**: Integration of "Builder Score" to display user reputation on-chain.
*   **🌐 Open Track**: Shipped live on Celo Mainnet during the hackathon month!

## ✨ Key Features

*   **Create Custom Pools**: Users can deploy their own ROSCA pools with custom contribution amounts, cycle durations, and token choices.
*   **Dual Token Support**: Flexible savings in native **CELO** or stable **cUSD**.
*   **AI-Powered Automation**: Our NoahAI agent monitors the blockchain 24/7. When a cycle ends and all members have contributed, the agent automatically executes the payout to the winner.
*   **Social Sharing**: Share pools on **Farcaster** with beautiful, dynamic Frames.
*   **Verified Trust**: Integration with **Self Protocol** ensures that pool creators are verified real humans.
*   **Reputation System**: **Talent Protocol** scores help users assess the reliability of pool members.
*   **Transparent & Fair**: All logic is on-chain. Winners are selected via a deterministic round-robin system.

## 🏗️ Tech Stack

*   **Blockchain**: Celo Mainnet (Chain ID: 42220)
*   **Smart Contracts**: Solidity
*   **Frontend**: Next.js 16, Tailwind CSS
*   **Web3 SDK**: Thirdweb v5
*   **AI Agent**: NoahAI (TypeScript, Node.js)
*   **Identity**: Self Protocol
*   **Reputation**: Talent Protocol
*   **Social**: Farcaster Frames
*   **Deployment**: Netlify (Frontend), Railway (Agent)

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   Celo Wallet (e.g., Valora, MetaMask)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/Gracing47/SusuFlow-AI.git
    cd SusuFlow-AI
    ```

2.  **Install Dependencies**
    ```bash
    # Frontend
    cd frontend
    npm install

    # Agent
    cd ../agent
    npm install
    ```

3.  **Run the Application**
    ```bash
    # Start Frontend
    cd frontend
    npm run dev
    ```

4.  **Run the AI Agent**
    ```bash
    # Start Agent
    cd agent
    npm run dev
    ```

## 📜 Smart Contracts (Mainnet)

*   **Factory Contract**: `0x3d0fBFb01837259f10f3793c695008a31815D39A`
*   **Verification**: `0x15ab8Fb807CbF0d0c2553E2bC1C2Abcf2Ee41D1b`
*   **cUSD Token**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## 👥 Team

*   **Gracing47** - Full Stack Developer

---

*Built with ❤️ for the Celo Community*
