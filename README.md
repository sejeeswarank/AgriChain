# AgriChain - Blockchain-Based Parametric Crop Insurance

AgriChain is a full-stack decentralized application (dApp) that provides automated crop insurance based on rainfall data. If rainfall drops below a specified threshold, farmers are automatically paid out via smart contract, verified by an off-chain weather oracle.

## Project Structure

- **/contracts**: Solidity smart contracts.
- **/backend**: Node.js/Express server with MongoDB.
- **/oracle-service**: Node.js script to fetch weather and sign reports.
- **/frontend**: React.js application.

## Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or Atlas URI)
- MetaMask Extension

## Setup Instructions

### 1. Smart Contract & Hardhat
1. Navigate to root: `cd p:\AgriChain`
2. Install dependencies: `npm install` (Installs hardhat, etc.)
3. Start local blockchain:
   ```bash
   npx hardhat node
   ```
4. Deploy contract (in new terminal):
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Copy the deployed Contract Address and update `CONTRACT_ADDRESS` in `keys/.env`.*

### 2. Backend Server
1. Navigate to backend: `cd backend`
2. Install dependencies: `npm install`
3. ensure `keys/.env` is configured (env vars are loaded from `../keys/.env`).
   ```env
   # In keys/.env
   MONGO_URI=mongodb://localhost:27017/agrichain
   RPC_URL=http://127.0.0.1:8545
   CONTRACT_ADDRESS=<PASTE_ADDRESS_HERE>
   ```
4. Start server:
   ```bash
   node server.js
   ```

### 3. Oracle Service
1. Navigate to oracle: `cd ../oracle-service`
2. Install dependencies: `npm install`
3. Ensure `keys/.env` has the Oracle configuration:
   ```env
   # In keys/.env
   RPC_URL=http://127.0.0.1:8545
   CONTRACT_ADDRESS=<PASTE_ADDRESS_HERE>
   ORACLE_PRIVATE_KEY=<PRIVATE_KEY_FROM_HARDHAT_NODE_ACCOUNT_0>
   ```
   *Note: Ensure the account used here matches the `oracle` address set in the contract constructor (defaults to deployer in our script).*
4. Run oracle (manual trigger):
   ```bash
   node index.js
   ```

### 4. Frontend
1. Navigate to frontend: `cd ../frontend`
2. Install dependencies: `npm install`
3. Start React app:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173`
5. Connect MetaMask (Ensure it's connected to `Localhost 8545` with Chain ID `1337` or `31337`).

## 🧪 Testing a Payout
1. **Buy Policy**: Use the frontend to buy a policy for "Tokyo" (Lat 35.68, Lon 139.76) with a high rainfall threshold (e.g., 100mm) to ensure payout.
2. **Trigger Oracle**: Run `node index.js` in `oracle-service`. It fetches yesterday's rain (likely < 100mm).
3. **Verify**:
   - Console logs in Oracle will show "Tx sent".
   - Backend console will show "Payout: ...".
   - Frontend policy card will update to "PAID OUT".

---
*Built for AgriChain requirements.*
