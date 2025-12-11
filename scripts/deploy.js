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

    console.log("Deployment and configuration setup complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
