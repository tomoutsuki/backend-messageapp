const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware de verificação de sessão
const isAuthenticated = (req, res, next) => {
	if (!req.session.userId) {
		return res.status(401).json({ message: 'Não autenticado' });
	}
	next();
};

// Deletar usuário por ID
router.delete('/:userId', isAuthenticated, async (req, res) => {
	try {
		const userId = req.params.userId;

		if (!userId) {
			return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
		}

		await User.deleteById(userId);
		logger.logInfo(`Usuário ${userId} deletado via userRoutes.`);
		res.json({ message: 'Usuário deletado com sucesso.' });

	} catch (error) {
		logger.logError(error);
		res.status(500).json({ message: 'Erro ao deletar usuário.' });
	}
});

module.exports = router;
