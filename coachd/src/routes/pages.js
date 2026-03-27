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
router.get('/blog', (req, res) => res.sendFile(path.join(pub, 'blog.html')));
router.get('/blog/:slug', (req, res) => {
  const slug = req.params.slug.replace(/[^a-z0-9-]/g, '');
  res.sendFile(path.join(pub, 'blog', `${slug}.html`), err => {
    if (err) res.status(404).sendFile(path.join(pub, '404.html'), () => res.status(404).send('Not found'));
  });
});

module.exports = router;
