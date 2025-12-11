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
    console.log("\x1b[32m[Startup] Starting AgriChain Services...\x1b[0m");

    // 1. Start Backend
    runProcess('npm', ['start'], path.resolve(__dirname, '../backend'), 'BACKEND', '33'); // Yellow

    // 2. Start Oracle
    runProcess('npm', ['start'], path.resolve(__dirname, '../oracle-service'), 'ORACLE', '35'); // Magenta

    // 3. Start Frontend
    runProcess('npm', ['run', 'dev', '--', '--open'], path.resolve(__dirname, '../frontend'), 'FRONTEND', '32'); // Green
}

main();
