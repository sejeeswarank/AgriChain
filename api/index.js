// Vercel Serverless Function Handler
// This file wraps the Express backend for Vercel's serverless environment

const app = require('../backend/server');

// Export the Express app as a serverless function handler
module.exports = app;
