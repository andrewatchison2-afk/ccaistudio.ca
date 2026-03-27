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

// Init DB then start server
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Coachd running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
