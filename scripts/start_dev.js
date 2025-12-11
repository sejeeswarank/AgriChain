const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Helper to spawn a process and pipe output
function runProcess(command, args, cwd, name, color) {
    console.log(`[Startup] Launching ${name}...`);
    const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
        env: { ...process.env, FORCE_COLOR: true } // Force color output
    });

    proc.stdout.on('data', (data) => {
        process.stdout.write(`\x1b[${color}m[${name}]\x1b[0m ${data}`);
    });

    proc.stderr.on('data', (data) => {
        process.stderr.write(`\x1b[${color}m[${name} ERROR]\x1b[0m ${data}`);
    });

    return proc;
}

async function main() {
    console.log("\x1b[32mStarting AgriChain Full Stack Development Environment (Sepolia Mode)...\x1b[0m");

    // 1. Deploy Contracts to Sepolia
    console.log("[Startup] Deploying contracts to Sepolia...");
    const { execSync } = require('child_process');
    try {
        execSync('npx hardhat run scripts/deploy.js --network sepolia', {
            cwd: path.resolve(__dirname, '..'),
            stdio: 'inherit'
        });
        console.log("\x1b[32m[Startup] Contracts deployed to Sepolia! Starting services...\x1b[0m");

        // 2. Start Backend
        runProcess('npm', ['start'], path.resolve(__dirname, '../backend'), 'BACKEND', '33'); // Yellow

        // 3. Start Oracle
        runProcess('npm', ['start'], path.resolve(__dirname, '../oracle-service'), 'ORACLE', '35'); // Magenta

        // 4. Start Frontend
        runProcess('npm', ['run', 'dev'], path.resolve(__dirname, '../frontend'), 'FRONTEND', '32'); // Green

    } catch (error) {
        console.error("\x1b[31m[Startup] Deployment failed. Aborting startup.\x1b[0m");
        process.exit(1);
    }
}

main();
