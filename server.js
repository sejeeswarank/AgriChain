const express = require('express');
const app = express();

app.use(express.json());

const sendEmailOtp = require('./api/send-email-otp');
app.use('/api/send-email-otp', sendEmailOtp);
app.use('/api/verify-otp', require('./api/verify-otp'));
app.use('/api/signup', require('./api/signup'));
app.use('/api/login', require('./api/login'));
app.use('/api/wallet-session', require('./api/wallet-session'));

module.exports = app;