const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, '../src/html/login.html'));
});

router.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname, '../src/html/register.html'));
});

router.get('/chat', (req, res) => {
	if (!req.session.userId) {
		return res.redirect('/pages/login');
	}
	res.sendFile(path.join(__dirname, '../src/html/chat.html'));
});

module.exports = router;
