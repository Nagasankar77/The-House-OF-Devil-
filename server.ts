/**
 * The House of Devil - Server Entry Point
 * Delegates to the modular backend server architecture located in /backend/server.ts
 */
import { startServer } from './backend/server';

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
