const { getDatabase } = require("../config/setup");
const { ObjectId } = require("mongodb");

class User {

	constructor({
		_id = null,
		name,
		email,
		passwordHash,
		profilePictureUrl = null,
		status = "Available",
		contacts = [],
		createdAt = null,
		updatedAt = null,
	})
	{
		this._id = _id ? new ObjectId(_id) : null;
		this.name = name;
		this.email = email;
		this.passwordHash = passwordHash;
		this.profilePictureUrl = profilePictureUrl;
		this.status = status;
		this.contacts = contacts.map(id => new ObjectId(id));
		this.createdAt = createdAt ? new Date(createdAt) : new Date();
		this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
	}

	setParameter(parameter, value) {
		if (this.hasOwnProperty(parameter)) {
			this[parameter] = value;
			return true;

		} else {
			return false;
		}
	}

	static getCollection() {
    		const db = getDatabase();
    		return db.collection("users");
  	}

	async save() {
		const collection = User.getCollection();
		this.updatedAt = new Date();

		if (this._id) {
			const { _id, ...data } = this;
			await collection.updateOne(
					{ _id: this._id },
					{ $set: { ...data, updatedAt: this.updatedAt } }
			);
		} else {
			const result = await collection.insertOne({
				name: this.name,
				email: this.email,
				passwordHash: this.passwordHash,
				profilePictureUrl: this.profilePictureUrl,
				status: this.status,
				contacts: this.contacts,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
			});
			this._id = result.insertedId;
		}

		return this._id;
	}

	async addContact(user) {
		const collection = User.getCollection();
		
		if (!this.contacts.includes(user._id)) {
			this.contacts.push(user._id);
			const { _id, ...data } = this;
			await collection.updateOne(
				{ _id: this._id },
				{ $set: { ...data, updatedAt: this.updatedAt } }
			);
		}
	}

	async updateStatus(newStatus) {
		this.status = newStatus;
		this.updatedAt = new Date();
		await User.getCollection().updateOne(
			{ _id: this._id },
			{ $set: { status: this.status, updatedAt: this.updatedAt } }
		);
	}
}

module.exports = User;