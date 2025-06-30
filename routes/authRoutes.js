const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../utils/logger');


router.post('/register', async (req, res) => {
	try {
		const { name, email, password, profilePictureUrl } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
		}

		const existingUser = await User.findByEmail(email);
		if (existingUser) {
			return res.status(409).json({ message: 'Usuário já existe' });
		}

		const userObj = new User({
			name,
			email,
			password,
			profilePictureUrl: profilePictureUrl || '',
			status: 'Available',
			contacts: []
		});

		const user = await User.create({
			name: userObj.name,
			email: userObj.email,
			password: userObj.password,
			profilePictureUrl: userObj.profilePictureUrl,
			status: userObj.status
		});

		await user.save();
		req.session.userId = user.id;

		logger.logInfo(`Usuário criado: ${user.name}`);
		res.redirect('/pages/chat');
	} catch (error) {
		logger.logError(error);
		res.status(500).json({ message: 'Erro ao cadastrar usuário' });
	}
});


router.post('/login', async (req, res) => {
	try {
		// Recebe email e password
		const { email, password } = req.body;

		// Verificação se email é válido
		if (!email || !isEmail(email)) return res.status(400).json({ message: 'Digite um email válido.' });

		// Verificação se usuário está cadastrado
		const user = await User.findByEmail(email);
		if (!user) return res.status(401).json({ message: 'Usuário não cadastrado.' });

		if (!user.comparePassword(password)) res.status(401).json({ message: 'Senha incorreta'});

		req.session.userId = user.id;
		logger.logInfo(`Login realizado pelo usuário: ${user.name}`);
		res.redirect('/pages/chat');

	} catch (error) {
		logger.logError(error);
		res.status(500).json({ message: 'Erro no login' });
	}
});


router.post('/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			logger.logError(err);
			return res.status(500).json({ message: 'Erro ao encerrar sessão' });
		}
		res.clearCookie('connect.sid');
		res.redirect('/pages/login');
	});
});

function isEmail(email) {
		var emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
		if (email !== '' && email.match(emailFormat)) { return true; }
		
		return false;
}

module.exports = router;
