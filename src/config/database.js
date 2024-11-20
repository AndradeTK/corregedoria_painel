const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.dbHost,
    user: process.env.dbUser,    
    password: process.env.dbSenha, 
    database: process.env.dbNome,
    port: process.env.dbPorta        
});

db.connect((err) => {
    if (err) {
        console.error('❌ » Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ » Conexão com o banco de dados estabelecida com sucesso!');
    }
});

module.exports = db;
