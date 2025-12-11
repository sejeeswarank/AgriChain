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
    console.log("\x1b[32mStarting AgriChain Full Stack Development Environment...\x1b[0m");

    // 1. Start Hardhat Node
    const nodeProcess = runProcess('npx', ['hardhat', 'node'], path.resolve(__dirname, '..'), 'NODE', '36'); // Cyan

    // Wait for node to be ready (look for "Started HTTP and WebSocket JSON-RPC server")
    console.log("[Startup] Waiting for blockchain to initialize...");

    // We'll give it a fixed 5 seconds for simplicity, real check is complex with streams
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Deploy Contracts
    console.log("[Startup] Blockchain ready. Deploying contracts...");
    // We use stdio: inherit here to show deploy logs directly
    const deployProc = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
        cwd: path.resolve(__dirname, '..'),
        shell: true,
        stdio: 'inherit'
    });

    deployProc.on('close', (code) => {
        if (code !== 0) {
            console.error("\x1b[31m[Startup] Deployment failed. Aborting startup.\x1b[0m");
            nodeProcess.kill();
            process.exit(1);
        }

        console.log("\x1b[32m[Startup] Contracts deployed! Starting services...\x1b[0m");

        // 3. Start Backend
        runProcess('npm', ['start'], path.resolve(__dirname, '../backend'), 'BACKEND', '33'); // Yellow

        // 4. Start Oracle
        runProcess('npm', ['start'], path.resolve(__dirname, '../oracle-service'), 'ORACLE', '35'); // Magenta

        // 5. Start Frontend
        runProcess('npm', ['run', 'dev'], path.resolve(__dirname, '../frontend'), 'FRONTEND', '32'); // Green
    });
}

main();
