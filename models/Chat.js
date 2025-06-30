const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/setup');
const logger = require('../utils/logger');
const Message = require('./Message');
const User = require('./User');

class Chat {
	// Constructor
	constructor({ _id, participants = [], createdAt }) {
		this._id = _id ? new ObjectId(_id) : null;
		this._participants = participants.map(id => new ObjectId(id));
		this._createdAt = createdAt ? new Date(createdAt) : new Date();
	}

	// Getter
	get id() { return this._id; }
	get participants() { return this._participants; }
	get createdAt() { return this._createdAt; }

	// Criação de nova sala
	static async findOrCreate(userId1, userId2) {
		try {
			const db = await getDatabase();

			// Verifica se o chat já existe entre os dois usuários
			const existing = await db.collection('chats').findOne({
				participants: { $all: [new ObjectId(userId1), new ObjectId(userId2)] }
			});
			if (existing) return new Chat(existing);

			const chatData = {
				participants: [new ObjectId(userId1), new ObjectId(userId2)],
				createdAt: new Date()
			};

			const result = await db.collection('chats').insertOne(chatData);
			logger.logInfo(`Chat criado entre ${userId1} e ${userId2}`);
			return new Chat({ _id: result.insertedId, ...chatData });
		} catch (error) {
			logger.logError('Erro ao criar chat:', error);
			throw error;
		}
	}

	// Enviar uma mensagem em um chat
	static async sendMessage(chatId, senderId, content) {
		try {
			const db = await getDatabase();

			// Buscar o nome do remetente
			const sender = await User.findById(senderId);
			console.log()
			const senderName = sender?.name || 'Desconhecido';


			const messageData = {
				chatId: new ObjectId(chatId),
				senderId: new ObjectId(senderId),
				content,
				createdAt: new Date(),
				senderName
			};


			const result = await db.collection('messages').insertOne(messageData);
			logger.logInfo(`Mensagem enviada no chat ${chatId} por ${senderId}`);
			return new Message({ _id: result.insertedId, ...messageData });
		} catch (error) {
			logger.logError('Erro ao enviar mensagem:', error);
			throw error;
		}
	}

	// Listar mensagens de um chat
	static async getMessages(chatId) {
		try {
			const db = await getDatabase();
			const messages = await db.collection('messages')
				.find({ chatId: new ObjectId(chatId) })
				.sort({ createdAt: 1 })
				.toArray();
			return messages.map(msg => new Message(msg));
		} catch (error) {
			logger.logError('Erro ao listar mensagens:', error);
			throw error;
		}
	}

	// Deletar uma mensagem (somente o autor pode deletar)
	static async deleteMessage(messageId, userId) {
		try {
			const db = await getDatabase();
			const message = await db.collection('messages').findOne({
				_id: new ObjectId(messageId),
				senderId: new ObjectId(userId)
			});

			if (!message) throw new Error('Mensagem não encontrada ou permissão negada.');

			await db.collection('messages').deleteOne({ _id: new ObjectId(messageId) });
			logger.logInfo(`Mensagem ${messageId} deletada por ${userId}`);
			return true;
		} catch (error) {
			logger.logError('Erro ao deletar mensagem:', error);
			throw error;
		}
	}

	static async findBetweenUsers(userId1, userId2) {
		try {
			const db = await getDatabase();
			const chat = await db.collection('chats').findOne({
				participants: {
					$all: [new ObjectId(userId1), new ObjectId(userId2)]
				}
			});
			return chat ? new Chat(chat) : null;
		} catch (error) {
			logger.logError('Erro ao buscar chat entre usuários:', error);
			throw error;
		}
	}

	static async delete(chatId) {
		try {
			const db = await getDatabase();

			// Deleta todas as mensagens do chat
			await db.collection('messages').deleteMany({
				chatId: new ObjectId(chatId)
			});

			// Deleta o próprio chat
			await db.collection('chats').deleteOne({
				_id: new ObjectId(chatId)
			});

			logger.logInfo(`Chat ${chatId} e todas as mensagens foram deletados.`);
			return true;
		} catch (error) {
			logger.logError('Erro ao deletar chat:', error);
			throw error;
		}
	}
}

module.exports = Chat;
