const { spawn } = require('child_process');

console.log("Starting Vite Dev Server...");
const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
