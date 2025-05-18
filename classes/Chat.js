const { getDatabase } = require("../config/setup");
const { ObjectId } = require("mongodb");

class Chat {
	constructor({
		participants,
		messages = [],
		_id = null
	})
	{
		this._id = _id ? new ObjectId(_id) : null;
		this.participants = participants.map(id => new ObjectId(id));
		this.messages = messages;
	}

	static getCollection() {
		const db = getDatabase();
		return db.collection("chats");
	}

	async save() {
		const collection = Chat.getCollection();

		if (this._id) {
			await collection.updateOne(
				{ _id: this._id },
				{ $set: { messages: this.messages, participants: this.participants } }
			);
		} else {
			const result = await collection.insertOne({
				participants: this.participants,
				messages: this.messages,
			});
			this._id = result.insertedId;
		}

		return this._id;
	}

	async addMessage(senderId, content) {
		const message = {
			senderId: new ObjectId(senderId),
			content,
			timestamp: new Date(),
		};

		this.messages.push(message);

		await Chat.getCollection().updateOne(
			{ _id: this._id },
			{ $push: { messages: message } }
		);
	}

	static async getChatBetweenUsers(userAId, userBId) {
		const collection = Chat.getCollection();

		const chat = await collection.findOne({
			participants: { $all: [new ObjectId(userAId), new ObjectId(userBId)] },
		});

		return chat ? new Chat(chat) : null;
	}

	static async createOrLoadChat(userAId, userBId) {
		let chat = await Chat.getChatBetweenUsers(userAId, userBId);
		if (!chat) {
			chat = new Chat({ participants: [userAId, userBId], messages: [] });
			await chat.save();
		}
		return chat;
	}

	static async getMessages(userAId, userBId) {
		const chat = await Chat.getChatBetweenUsers(userAId, userBId);
		return chat ? chat.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : [];
	}
}

module.exports = Chat;
