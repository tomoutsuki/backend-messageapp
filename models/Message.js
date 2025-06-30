const { ObjectId } = require('mongodb');

class Message {
	constructor({ _id, chatId, senderId, content, createdAt, senderName }) {
		this._id = _id ? new ObjectId(_id) : null;
		this._chatId = new ObjectId(chatId);
		this._senderId = new ObjectId(senderId);
		this._content = content;
		this._createdAt = createdAt ? new Date(createdAt) : new Date();
		this._senderName = senderName || null;
	}

	get id() { return this._id; }
	get chatId() { return this._chatId; }
	get senderId() { return this._senderId; }
	get content() { return this._content; }
	get createdAt() { return this._createdAt; }
	get senderName() { return this._senderName; }

	// Devolver em JSON, para resolver problema de serialização
	toJSON() {
		return {
			id: this.id,
			chatId: this.chatId,
			senderId: this.senderId,
			senderName: this.senderName,
			content: this.content,
			createdAt: this.createdAt
		};
	}
}

module.exports = Message;
