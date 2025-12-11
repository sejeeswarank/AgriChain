const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const oracleAddress = deployer.address;
    console.log("Oracle Address set to:", oracleAddress);

    const AgriChainPolicy = await hre.ethers.getContractFactory("AgriChainPolicy");
    const agriChain = await AgriChainPolicy.deploy(oracleAddress);

    await agriChain.waitForDeployment();

    console.log(
        `AgriChainPolicy deployed to ${agriChain.target} with oracle ${oracleAddress}`
    );

    const { execSync } = require('child_process');
    try {
        console.log("Exporting ABIs...");
        execSync('node scripts/exportAbi.js', { stdio: 'inherit' });
        console.log("ABIs exporter successfully.");
    } catch (error) {
        console.error("Failed to export ABIs:", error);
    }

    // Update .env with new contract address
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../keys/.env');

    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        const regex = /^CONTRACT_ADDRESS=.*$/m;
        const newEntry = `CONTRACT_ADDRESS=${agriChain.target}`;

        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, newEntry);
        } else {
            envContent += `\n${newEntry}`;
        }

        const viteRegex = /^VITE_CONTRACT_ADDRESS=.*$/m;
        const newViteEntry = `VITE_CONTRACT_ADDRESS=${agriChain.target}`;
        if (viteRegex.test(envContent)) {
            envContent = envContent.replace(viteRegex, newViteEntry);
        } else {
            envContent += `\n${newViteEntry}`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log(`Updated .env with new Contract Address: ${agriChain.target}`);
    } else {
        console.warn(".env file not found at " + envPath);
    }

    console.log("Deployment and configuration setup complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
