const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/setup');
const logger = require('../utils/logger');

class User {
	constructor({
		_id,
		name,
		email,
		password,
		profilePictureUrl = '',
		status = 'Available',
		contacts = [],
		createdAt = new Date(),
		updatedAt = new Date()
	}) {
		this._id = _id ? new ObjectId(_id) : null;
		this._name = name;
		this._email = email;
		this._password = password;
		this._profilePictureUrl = profilePictureUrl;
		this._status = status;
		this._contacts = contacts;
		this._createdAt = new Date(createdAt);
		this._updatedAt = new Date(updatedAt);
	}

	// Getters
	get id() { return this._id; }
	get name() { return this._name; }
	get email() { return this._email; }
	get password() { return this._password; }
	get profilePictureUrl() { return this._profilePictureUrl; }
	get status() { return this._status; }
	get contacts() { return this._contacts; }
	get createdAt() { return this._createdAt; }
	get updatedAt() { return this._updatedAt; }

	// Setters
	set name(value) { this._name = value; }
	set email(value) { this._email = value; }
	set password(value) { this._password = value; }
	set profilePictureUrl(value) { this._profilePictureUrl = value; }
	set status(value) { this._status = value; }
	set contacts(value) { this._contacts = value; }

	// Comparação de senha
	comparePassword(text) {
		return this._password === text;
	}

	// Criar novo usuário no banco
	static async create(userData) {
		try {
			const db = await getDatabase();
			const timestamp = new Date();
			const userToInsert = {
				...userData,
				contacts: [],
				createdAt: timestamp,
				updatedAt: timestamp
			};
			const result = await db.collection('users').insertOne(userToInsert);
			return new User({ _id: result.insertedId, ...userToInsert });
		} catch (error) {
			logger.logError('Erro ao criar usuário:', error);
			throw error;
		}
	}

	// Salvar os dados de variável no banco de dados
	async save() {
		if (!this._id) {
			throw new Error('Usuário não possui _id. Use User.create() para criar novos usuários.');
		}

		try {
			const db = await getDatabase();
			this._updatedAt = new Date();

			const updatedData = {
				name: this._name,
				email: this._email,
				password: this._password,
				profilePictureUrl: this._profilePictureUrl,
				status: this._status,
				contacts: this._contacts,
				createdAt: this._createdAt,
				updatedAt: this._updatedAt
			};

			await db.collection('users').updateOne(
				{ _id: this._id },
				{ $set: updatedData }
			);

			return true;
		} catch (error) {
			logger.logError('Erro ao salvar usuário:', error);
			throw error;
		}
	}

	// Buscar por e-mail
	static async findByEmail(email) {
		try {
			const db = await getDatabase();
			const data = await db.collection('users').findOne({ email });
			return data ? new User(data) : null;
		} catch (error) {
			logger.logError('Erro ao buscar usuário por e-mail:', error);
			throw error;
		}
	}

	// Buscar por ID
	static async findById(id) {
		try {
			const db = await getDatabase();
			const data = await db.collection('users').findOne({ _id: new ObjectId(id) });
			return data ? new User(data) : null;
		} catch (error) {
			logger.logError('Erro ao buscar usuário por ID:', error);
			throw error;
		}
	}

	// Adicionar contato
	static async addContact(userId, contactId) {
		try {
			const db = await getDatabase();
			await db.collection('users').updateOne(
				{ _id: new ObjectId(userId) },
				{
					$addToSet: { contacts: new ObjectId(contactId) },
					$set: { updatedAt: new Date() }
				}
			);
			return await this.findById(userId);
		} catch (error) {
			logger.logError('Erro ao adicionar contato:', error);
			throw error;
		}
	}

	static async deleteById(userId) {
	try {
		const db = await getDatabase();
		const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

		if (result.deletedCount === 0) {
			throw new Error('Usuário não encontrado ou já deletado.');
		}

		logger.logInfo(`Usuário ${userId} deletado com sucesso.`);
		return true;
	} catch (error) {
		logger.logError('Erro ao deletar usuário:', error);
		throw error;
	}
}
}

module.exports = User;
