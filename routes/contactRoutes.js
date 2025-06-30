const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

const User = require('../models/User');
const Chat = require('../models/Chat');
const Contact = require('../models/Contact');

const { ObjectId } = require('mongodb');


const isAuthenticated = (req, res, next) => {
	if (!req.session.userId) {
		return res.status(401).json({ message: 'Não autenticado' });
	}
	next();
};

router.get('/', isAuthenticated, async (req, res) => {
	try {
		const contatos = await Contact.listContacts(req.session.userId);

		const formatted = contatos.map(c => ({
			id: c._id.toString(),
			nome: c.name
		}));

		res.json(formatted);
	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: 'Erro ao carregar contatos' });
	}
});

router.post('/', isAuthenticated, async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: 'Email é obrigatório' });

		const contato = await User.findByEmail(email);
		if (!contato) {
			return res.status(404).json({ message: 'Contato não encontrado' });
		}

		await Contact.addContact(req.session.userId, contato.id);

		res.status(201).json({ id: contato.id, nome: contato.name });

	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: err.message || 'Erro ao adicionar contato' });
	}
});

router.delete('/:contactId', isAuthenticated, async (req, res) => {
	try {
		const userId = req.session.userId;
		const contactId = req.params.contactId;

		await Contact.removeContact(userId, contactId);

		const chat = await Chat.findBetweenUsers(userId, contactId);
		if (chat) {
			await Chat.delete(chat.id);
			logger.logInfo(`Chat e mensagens entre ${userId} e ${contactId} foram removidos.`);
		}

		logger.logInfo(`Contato ${contactId} removido por ${userId}`);
		res.json({ message: 'Contato e conversas removidos com sucesso' });

	} catch (err) {
		logger.logError(err);
		res.status(500).json({ message: err.message || 'Erro ao remover contato' });
	}
});

module.exports = router;