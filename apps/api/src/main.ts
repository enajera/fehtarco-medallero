import { createApp } from './app';

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`
  🏹 Sistema Medallero Federativo API
  ====================================
  🚀 Server running on port ${PORT}
  📍 Local:   http://localhost:${PORT}
  📍 API:     http://localhost:${PORT}/api
  📍 Health:  http://localhost:${PORT}/api/health
  ====================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
