const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let database;

async function connect() {
  try {
    console.log("conectando ao banco de dados...")
    await client.connect();
    database = client.db("App");
    console.log("conectado!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function getDatabase() {
  if (!database) throw new Error("Erro de conexão com MongoDB.");
  return database;
}

module.exports = { connect, getDatabase };
