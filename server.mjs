import express from 'express';
import pg from 'pg';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÕES BÁSICAS ---
const app = express();
const PORT = process.env.PORT || 3000;const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARES ---// Isso faz o Express servir seus arquivos HTML, CSS e JS da pasta raiz
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// server.mjs

app.use((req, res, next) => {
    // Esses headers resolvem o conflito com o Popup do Google
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // Opcional, mas ajuda na segurança
    next();
});

// Servir arquivos estáticos (assumindo que o index.html está na raiz)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Criar tabela se não existir
const initDb = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            description TEXT NOT NULL,
            value DECIMAL(10,2) NOT NULL,
            type TEXT NOT NULL,
            date DATE NOT NULL
        )
    `);
};
initDb();

// Rota para buscar transações por usuário e período
app.get('/api/transactions', async (req, res) => {
    const { userId, month, year } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM transactions 
             WHERE user_id = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND EXTRACT(YEAR FROM date) = $3 
             ORDER BY date ASC`,
            [userId, month, year]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// Rota para salvar
app.post('/api/transactions', async (req, res) => {
    const { userId, description, value, type, date } = req.body;
    try {
        await pool.query(
            'INSERT INTO transactions (user_id, description, value, type, date) VALUES ($1, $2, $3, $4, $5)',
            [userId, description, value, type, date]
        );
        res.status(201).send('Salvo');
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));