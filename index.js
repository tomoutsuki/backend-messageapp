const readline = require("readline");

const { connect } = require("./config/setup");
const { findUser, findByEmail, dropUser} = require("./utils/userUtils.js");

const User = require("./classes/User.js");
const Chat = require("./classes/Chat.js");

const { showLogo } = require("./misc/logo.js");
const { createOrLoadChat } = require("./classes/Chat.js");

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
				rl.close();
				return;
			}
			const user = await findByEmail(email);
			if (!user) {
				console.log("Usuário não encontrado.");
				
				await createConfirmation();
			}

			currentUser = user;
			console.log(currentUser);
			await mainMenu();
	});
}

async function createConfirmation() {
	await sleep(100);
	rl.question("Gostaria de cadastrar uma nova conta? (y/n): \n",
		async (option) => {
			switch (option) {
				case "y":
					await signUp();
					break;

				case "n":
				default:
					rl.close();
					return;
			}
		}
	);
}

async function signUp() {

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
					rl.close();
					return;
				default:
					console.log("Escolha uma opção válida.");
					rl.close();
					return;
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

			const user = await findByEmail(email);
			if (!user) {
				console.log("Usuário não encontrado.");
				rl.close();
				await mainMenu();
			}
			console.log(user);
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
	showLogo();
	await connect();
	await loginFlow();
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

main();

