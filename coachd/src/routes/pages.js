const express = require('express');
const path = require('path');
const router = express.Router();
const pub = path.join(__dirname, '../public');

router.get('/', (req, res) => res.sendFile(path.join(pub, 'index.html')));
router.get('/signup', (req, res) => res.sendFile(path.join(pub, 'signup.html')));
router.get('/dashboard', (req, res) => res.sendFile(path.join(pub, 'dashboard.html')));
router.get('/pricing', (req, res) => res.sendFile(path.join(pub, 'pricing.html')));
router.get('/privacy', (req, res) => res.sendFile(path.join(pub, 'privacy.html')));
router.get('/terms', (req, res) => res.sendFile(path.join(pub, 'terms.html')));

module.exports = router;
