import app from './app.js';

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  SCAMCHECK Backend Engine Active on Port ${PORT}`);
  console.log(`📡 Endpoints: http://localhost:${PORT}/api/investigate`);
  console.log(`🔬 Health:    http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Port ${PORT} is already in use — another SCAMCHECK backend (or other app) is still running.\n` +
        `   Stop it first, or start on another port, e.g. PowerShell: $env:PORT=5002; npm run start\n`
    );
    process.exit(1);
  }
  throw err;
});
