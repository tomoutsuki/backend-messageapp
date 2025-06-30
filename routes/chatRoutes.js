const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const logger = require('../utils/logger');

// Verificação da Session
const isAuthenticated = (req, res, next) => {
	if (!req.session.userId) {
		return res.status(401).json({ message: 'Não autenticado' });
	}
	next();
};

// Criar ou carregar um chat entre dois usuários
router.post('/start/:userId', isAuthenticated, async (req, res) => {
	try {
		const chat = await Chat.findOrCreate(req.session.userId, req.params.userId);
		res.status(201).json(chat);
	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: 'Erro ao iniciar ou carregar chat' });
	}
});

// Enviar mensagem no chat
router.post('/:chatId/messages', isAuthenticated, async (req, res) => {
	try {
		const { message: content } = req.body;
		console.log(content);
		if (!content) return res.status(400).json({ message: 'Mensagem não pode ser vazia' });

		const novaMensagem = await Chat.sendMessage(req.params.chatId, req.session.userId, content);
		res.status(201).json(novaMensagem);
	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: 'Erro ao enviar mensagem' });
	}
});

// Listar mensagens do chat
router.get('/:chatId/messages', isAuthenticated, async (req, res) => {
	try {
		const mensagens = await Chat.getMessages(req.params.chatId);
		const formatadas = mensagens.map(msg => msg.toJSON());
		res.json(formatadas);
	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: 'Erro ao listar mensagens' });
	}
});

module.exports = router;
