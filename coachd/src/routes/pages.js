const express = require('express');
const path = require('path');
const router = express.Router();
const pub = path.join(__dirname, '../public');

router.get('/', (req, res) => res.sendFile(path.join(pub, 'index.html')));
router.get('/signup', (req, res) => res.sendFile(path.join(pub, 'signup.html')));
router.get('/dashboard', (req, res) => res.sendFile(path.join(pub, 'dashboard.html')));
router.get('/pricing', (req, res) => res.sendFile(path.join(pub, 'pricing.html')));

module.exports = router;
