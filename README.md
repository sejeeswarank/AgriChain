# AgriChain - Blockchain-Based Parametric Crop Insurance

AgriChain is a full-stack decentralized application (dApp) that provides automated crop insurance based on rainfall data. If rainfall drops below a specified threshold, farmers are automatically paid out via smart contract, verified by an off-chain weather oracle.

## 🌟 Features
- **Decentralized Parametric Insurance**: Payouts triggered automatically based on weather data.
- **Off-chain Weather Oracle**: Securely fetches and signs weather data from the Open-Meteo API.
- **Web3 Integration**: Smart contracts written in Solidity and deployed via Hardhat.
- **Secure Authentication**: User authentication managed via Firebase.
- **Modern Frontend**: Built with React and Vite, featuring a responsive UI with multi-language and wallet connect support.
- **Robust Backend**: Node.js/Express server backed by MongoDB for storing off-chain metadata and handling email notifications.

## 📂 Project Structure
- **/contracts**: Solidity smart contracts and Hardhat deployment scripts.
- **/backend**: Node.js/Express server connected to MongoDB. Handles API requests for off-chain data.
- **/oracle-service**: Node.js script (cron/manual) to fetch weather from an API and securely sign reports.
- **/frontend**: React.js application using Vite, React Router, Ethers.js, and Firebase Auth.

## 🛠 Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Running locally or MongoDB Atlas)
- Firebase Account (for Authentication)
- MetaMask Extension

## 🚀 Setup Instructions

### 1. Environment Variables Configuration
You will need to set up environment variables across the application. A central `.env.local` or `.env` file can be used in the root, or you can configure `.env` files in specific directories (`backend`, `oracle-service`, `frontend`).

**Key Environment Variables Example:**
```env
# Smart Contract & Web3
CONTRACT_ADDRESS=<Deployed_Contract_Address>
RPC_URL=<Your_RPC_URL> # e.g. http://127.0.0.1:8545 or Infura/Alchemy URL
PRIVATE_KEY=<Deployer_Private_Key>

# Oracle Service
ORACLE_ADDRESS=<Oracle_Public_Address>
ORACLE_PRIVATE_KEY=<Oracle_Signer_Private_Key>
WEATHER_API_URL=https://archive-api.open-meteo.com/v1/archive

# Backend Database & Email (Optional)
MONGO_URI=mongodb://localhost:27017/agrichain
PORT=5000
RESEND_API_KEY=<Your_Resend_API_Key>

# Frontend Firebase Config (Vite requires VITE_ prefix)
VITE_FIREBASE_API_KEY=<Firebase_API_Key>
VITE_FIREBASE_AUTH_DOMAIN=<Firebase_Auth_Domain>
VITE_FIREBASE_PROJECT_ID=<Firebase_Project_ID>
VITE_FIREBASE_STORAGE_BUCKET=<Firebase_Storage_Bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<Firebase_Messaging_Sender_ID>
VITE_FIREBASE_APP_ID=<Firebase_App_ID>
VITE_FIREBASE_MEASUREMENT_ID=<Firebase_Measurement_ID>
VITE_FIREBASE_DATABASE_URL=<Firebase_Database_URL>

VITE_BACKEND_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=<Deployed_Contract_Address>
VITE_RPC_URL=<Your_RPC_URL>
```

### 2. Smart Contract & Hardhat
1. Navigate to the root directory: `cd p:\AgriChain`
2. Install dependencies: `npm install`
3. Start the local blockchain in a separate terminal:
   ```bash
   npx hardhat node
   ```
4. Deploy the smart contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Copy the deployed Contract Address and update your environment variables.*

### 3. Backend Server
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Ensure your MongoDB service is running locally or provide a valid Atlas URI.
4. Start the server:
   ```bash
   npm run dev
   ```

### 4. Oracle Service
1. Navigate to the oracle directory: `cd oracle-service`
2. Install dependencies: `npm install`
3. Ensure `ORACLE_PRIVATE_KEY` matches the authorized oracle address set during deployment.
4. Run the oracle (manual trigger):
   ```bash
   node index.js
   ```

### 5. Frontend Application
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Ensure all your `VITE_` prefixed environment variables are correctly set.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.
6. Connect your MetaMask wallet (Ensure it's connected to your designated network, e.g., Localhost 8545 with Chain ID 1337 or 31337).

## 🧪 Testing a Payout
1. **Buy a Policy**: Use the frontend platform to sign up/log in (via Firebase), connect your wallet, and purchase a policy for a specific location (e.g., Tokyo - Lat 35.68, Lon 139.76) with a high rainfall threshold to guarantee a payout condition.
2. **Trigger the Oracle**: Run `node index.js` in the `oracle-service` directory. It will fetch the previous day's rainfall data from the Open-Meteo API.
3. **Verify Execution**:
   - The Oracle console will log the transaction details.
   - The Backend console will confirm the payout event.
   - On the Frontend Dashboard, your policy status will update to "PAID OUT".

---
*Built for AgriChain requirements. Focuses on bridging off-chain climate data with on-chain parametric insurance execution.*
