const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureLogDirectoryExists() {
	if (!fs.existsSync(LOG_DIR)) {
		fs.mkdirSync(LOG_DIR, { recursive: true });
	}
}

function formatLog(level, message) {
	let timestamp = getTimestamp();
	return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

function getTimestamp() {
	const date = new Date();
	const day = date.toLocaleDateString("pt-BR");
	const time = date.toLocaleTimeString("pt-BR");
	return `${day}-${time}`
}

function logInfo(message) {
	ensureLogDirectoryExists();
	const formatted = formatLog("info", message);
	fs.appendFileSync(LOG_FILE, formatted, "utf8");
}

function logError(error) {
	ensureLogDirectoryExists();
	

	const formatted = formatLog("error", error.stack || error.toString());
	fs.appendFileSync(LOG_FILE, formatted, "utf8");
}

module.exports = {
	logInfo,
	logError,
};
