const express = require('express');
const session = require('express-session');
const logger = require('./utils/logger');
const { connect } = require('./config/setup');
const path = require('path');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const pageRoutes = require('./routes/pageRoutes');
const contactRoutes = require('./routes/contactRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 25565;

// Middlewares de requisição
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use('/static', express.static(path.join(__dirname, 'src/static')));

// Sessões (armazenadas em memória por padrão)
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60, // 1 hora
		httpOnly: true, // não acessível por JS no navegador
	}
}));

// Conectar ao MongoDB
connect()
	.then(() => logger.logInfo('MongoDB conectado com sucesso.'))
	.catch(err => logger.logError('Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/pages', pageRoutes);
app.use('/contatos', contactRoutes);
app.use('/users', userRoutes);

// Rota raiz
app.get('/', (req, res) => {
	res.json({ message: 'API de Mensagens Instantâneas ativa!' });
});

// Tratamento de Erro
app.use((err, req, res, next) => {
	logger.logError(err.stack);
	res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização
app.listen(PORT, () => {
	logger.logInfo(`Servidor rodando na porta ${PORT}`);
});
