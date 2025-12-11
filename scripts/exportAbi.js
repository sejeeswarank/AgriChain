const fs = require('fs');
const path = require('path');

const ARTIFACT_PATH = path.join(__dirname, '../artifacts/contracts/AgriChainPolicy.sol/AgriChainPolicy.json');
const OUTPUT_DIRS = [
    path.join(__dirname, '../keys/abis'),
    path.join(__dirname, '../frontend/src/abis'),
    path.join(__dirname, '../backend/abis')
];

async function main() {
    if (!fs.existsSync(ARTIFACT_PATH)) {
        console.error('Artifact not found. Run "npx hardhat compile" first.');
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
    const abiData = JSON.stringify({ abi: artifact.abi }, null, 2);

    OUTPUT_DIRS.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'AgriChainPolicy.json');
        fs.writeFileSync(filePath, abiData);
        console.log(`Exported ABI to: ${filePath}`);
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
