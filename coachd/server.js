require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDB } = require('./src/db/schema');

const app = express();

// Stripe webhook needs raw body
app.use('/webhook', express.raw({ type: 'application/json' }));

// Everything else
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/public')));

// Routes
app.use('/', require('./src/routes/pages'));
app.use('/api', require('./src/routes/api'));
app.use('/webhook', require('./src/routes/webhook'));

// Init DB
initDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏒 Coachd running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`\n   To test on your phone:`);
  console.log(`   Find your IP: run 'ipconfig' (Windows) or 'ifconfig | grep inet' (Mac)`);
  console.log(`   Open http://[your-ip]:${PORT} on your phone (same WiFi)\n`);
});
