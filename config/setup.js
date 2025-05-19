const { MongoClient } = require("mongodb");
const logger = require("../utils/logger");
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
    logger.logInfo("Conexão com banco de dados.");
    
  } catch (error) {
    console.error(error);
    logger.logError(error);
    process.exit(1);
  }
}

function getDatabase() {
  if (!database) throw new Error("Erro de conexão com MongoDB.");
  return database;
}

module.exports = { connect, getDatabase };
