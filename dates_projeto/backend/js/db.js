const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'D4V1',
  database: 'date_prod'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.stack);
    return;
  }
  console.log('Conectado ao MySQL com sucesso!');
});

module.exports = connection;
