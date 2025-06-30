const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/setup');
const logger = require('../utils/logger');
const User = require('./User');

class Contact {
	constructor({ userId, contactId }) {
		this._userId = new ObjectId(userId);
		this._contactId = new ObjectId(contactId);
	}

	// Getters
	get userId() { return this._userId; }
	get contactId() { return this._contactId; }

	// Setters
	set userId(value) { this._userId = new ObjectId(value); }
	set contactId(value) { this._contactId = new ObjectId(value); }

	// Métodos estáticos

	// Listar contatos
	static async listContacts(userId) {
		try {
			const user = await User.findById(userId);
			if (!user) throw new Error('Usuário não encontrado.');

			const db = await getDatabase();

			const chats = await db.collection('chats')
				.find({ participants: new ObjectId(userId) })
				.toArray();

			console.log(chats);
			const chatParticipantIds = chats
				.flatMap(chat => chat.participants)
				.map(id => id.toString())
				.filter(id => id !== userId.toString());

			const allContactIds = [
				...(user.contacts || []).map(id => id.toString()),
				...chatParticipantIds
			];

			const uniqueContactIds = [...new Set(allContactIds)].map(id => new ObjectId(id));

			const contacts = await db.collection('users')
				.find({ _id: { $in: uniqueContactIds } })
				.project({ name: 1, email: 1 })
				.toArray();

			return contacts;

			// O contato estava sendo adicionado manualmente, então um receptor X não veria o contato, mesmo com a mensagem enviada.
			// Alterado para verificar sempre no banco.

		} catch (error) {
			logger.logError('Erro ao listar contatos:', error);
			throw error;
		}
	}

	static async addContact(userId, contactId) {
		try {
			if (userId === contactId) {
				throw new Error('Não é possível adicionar a si mesmo como contato.');
			}

			const user = await User.findById(userId);
			const contact = await User.findById(contactId);

			if (!user || !contact) {
				throw new Error('Usuário ou contato não encontrado.');
			}

			if ((user.contacts || []).some(id => id.toString() === contactId)) {
				throw new Error('Contato já adicionado.');
			}

			await User.addContact(userId, contactId);
			await User.addContact(contactId, userId);

			logger.logInfo(`Contato ${contactId} adicionado ao usuário ${userId}`);
			return await User.findById(userId);
		} catch (error) {
			logger.logError('Erro ao adicionar contato:', error.message);
			throw error;
		}
	}

	static async removeContact(userId, contactId) {
	try {
		const db = await getDatabase();

		await db.collection('users').updateOne(
			{ _id: new ObjectId(userId) },
			{ $pull: { contacts: new ObjectId(contactId) } }
		);

		await db.collection('users').updateOne(
			{ _id: new ObjectId(contactId) },
			{ $pull: { contacts: new ObjectId(userId) } }
		);

		logger.logInfo(`Contatos removidos no ${userId} e ${contactId}`);

		return await User.findById(userId);

	} catch (error) {
		logger.logError('Erro ao remover contato:', error);
		throw error;
	}
}
}

module.exports = Contact;