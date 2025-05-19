const readline = require("readline");

const { connect } = require("./config/setup");
const { findUser, findByEmail, dropUser} = require("./utils/userUtils.js");

const User = require("./classes/User.js");
const Chat = require("./classes/Chat.js");

const { showLogo } = require("./misc/logo.js");
const { createOrLoadChat } = require("./classes/Chat.js");
const logger = require("./utils/logger");

let currentUser = null;
let contactGroup = [];
let sessionUser = null;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
    	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

async function loginFlow() {
	rl.question("Digite seu email: \n",
		async (email) => {
			if (!validateEmail(email)) {
				console.log("Email inválido.");
				process.exit(1);
			}
			let user;
			try {
				user = await findByEmail(email);
			} catch (error) {
				logger.logError(error);
				process.exit(1);
			}
			
			if (!user) {
				console.log("Usuário não encontrado.");
				await createConfirmation();
				return;
			}

			currentUser = user;
			await mainMenu();
	});
}

async function createConfirmation() {
	await sleep(100);
	let option = await ask("Você não possui uma conta! Gostaria de realizar o cadastro? (y/n) >>> ");
	switch (option) {
		case "y":
			await signUp();
			break;

		case "n":
		default:
			process.exit(0);
	}
}

async function signUp() {
	let name = await ask("Digite o seu nome >>> ");
	let email = await ask("Digite o seu email >>> ");
	if (!validateEmail(email)) {
		console.log("Email inválido!");
		process.exit(0);
	}
	let passwordHash = "TESTHASH";
	let profilePictureUrl = "tetsturl.com";
	let status = "Available";
	let contacts = [];
	
	let user = new User({
		name,
		email,
		passwordHash,
		profilePictureUrl,
		status,
		contacts,
	});
	await user.save();
	currentUser = user;
	console.log("Usuário criado com sucesso!");
	logger.logInfo(`Criação de conta por usuário ${name}.`);
	process.exit(0);
}

async function mainMenu() {
	await sleep(100);
	console.log("1. Abrir chat");
	console.log("2. Adicionar novo contato");
	console.log("3. Sair");
	rl.question("Digite o número da opção desejada: \n",
		async (option) => {
			switch (option) {
				case "1": 
					await openChat();
					break;
				case "2":
					await newChat();
					break;
				case "3":
					process.exit(0);
				default:
					console.log("Escolha uma opção válida.");
					process.exit(0);
			}
		}
	)
}

async function newChat() {
	await sleep(100);
	console.log("Adicione um novo contato, para isso,");
	rl.question("digite o email do destinatário: (Digite !voltar para voltar) \n" ,
		async (email) => {
			if (email == "!voltar") await mainMenu();

			let user;

			try {
				user = await findByEmail(email);
			} catch (error) {
				logger.logError(error);
				console.log("Erro ao buscar usuário por email.")
				process.exit(1);
			}

			if (!user) {
				logger.logError("Tentativa de login sem sucesso: usuário não encontrado.");
				console.log("Usuário não encontrado.");
				process.exit(1);
			}
			console.log(user);
			console.log(currentUser);
			await currentUser.addContact(user);
			await openChat();
		}
	)
	
}

async function openChat() {
	await sleep(100);
	for (let i = 0; i < currentUser.contacts.length; i++) {
		let user = await findUser({"_id": currentUser.contacts[i]});
		contactGroup.push(user);
		console.log(`${i}. ${user.name}`);
	}

	rl.question("Selecione o chat que você quer conversar. \n",
		async (option) => {
			option = parseInt(option);
			if (isNaN(option) || option < 0 || option >= currentUser.contacts.length) {
				console.log("Digite um valor válido");
				return;
			}
			sessionUser = contactGroup[option];
			await chatSession();
		}
	)
}
function ask(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function chatSession() {
	await sleep(100);
	console.log(`Chat inicializado com ${sessionUser.name}! (Digite !sair para voltar ao menu inicial)\n\n`);
	await sleep(2000);
	const chat = await Chat.createOrLoadChat(currentUser._id, sessionUser._id);
	await displayChat(chat);

	async function chatLoop() {
		while (true) {
			const msg = await ask(`${currentUser.name} >>> `);
			if (msg.trim() === "!sair" || msg.trim() === "") {
				console.log("Encerrando chat.");
				break;
			}
			await chat.addMessage(currentUser._id, msg);
			await displayChat(chat);
		}

		rl.close();
	}
	await chatLoop();
}

async function displayChat(chat) {
	console.clear();
	let messageLog = chat.messages;
	if (messageLog.length !== 0) {
		messageLog = messageLog.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
	}
	messageLog.forEach((msg) => {
		const date = new Date(msg.timestamp);
		const day = date.toLocaleDateString("pt-BR");
		const time = date.toLocaleTimeString("pt-BR");
		let senderName;
		switch (msg.senderId.toString()) {
			case currentUser._id.toString():
				senderName = currentUser.name;
				break;
			case sessionUser._id.toString():
				senderName = sessionUser.name;
				break;
			default:
				senderName = currentUser.name;
				break;
		}
		

		console.log(`${day}, ${time} - ${senderName} >>> ${msg.content}`);
	})
}

async function main() {
	logger.logInfo("Aplicação iniciada.");
	showLogo();
	await connect();
	await loginFlow();
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

main();

