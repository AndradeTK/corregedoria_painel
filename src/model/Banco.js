const mysql = require('mysql2');
const database = "corregedoria_painel"

const db = mysql.createConnection({
  host: 'localhost', // Endereço do servidor MySQL
  port: 3306,        // Porta do servidor MySQL
  user: 'root',      // Nome do usuário
  password: '', // Senha do usuário
  database: database // Nome do banco de dados
});


db.connect(err => {
  if (err) throw err;
  console.log(`✅ » Database ${database} conectada!`);
});
