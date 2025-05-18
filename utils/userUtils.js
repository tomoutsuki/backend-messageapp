const { getDatabase } = require("../config/setup");
const User = require("../classes/User.js");
const collectionName = "users";

module.exports = {
	findUser: async (filter={}) => {
		const db = getDatabase();
		const user = await db.collection("users").findOne(filter);
		userClass = new User(user);
		return userClass;
	},

	findByEmail: async (email) => {
		const db = getDatabase();
		const user = await db.collection("users").findOne({ email });
		userClass = new User(user);
		return userClass;
	},
	dropUser: async (id) => {
		const db = getDatabase();
		const { ObjectId } = require("mongodb");
		const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
		return result;
	}
}