const express = require('express');
const cors = require('cors');
const connection = require('./js/db');

const app = express();
app.use(express.json());
app.use(cors());

// 📌 ROTA 1: Buscar todos os Dates e Ideias
app.get('/api/state', (req, res) => {
  const queryDates = "SELECT ID_DATE as id, NOME_DATE as nome, LOCAL_DATE as local, DATE_FORMAT(DIA_DATE, '%Y-%m-%d') as data, PERIODO_DATE as periodo, HORA_DATE as hora FROM marcar_date";
  const queryIdeias = 'SELECT ID_IDEIA as id, TEXTO_IDEIA as texto FROM ideia_date';

  connection.query(queryDates, (err, dates) => {
    if (err) return res.status(500).json({ error: err.message });

    connection.query(queryIdeias, (err, ideias) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ dates, ideias });
    });
  });
});

// 📌 ROTA 2: Salvar um novo Date
app.post('/api/dates', (req, res) => {
  const { nome, local, data, periodo, hora } = req.body;
  const query = 'INSERT INTO marcar_date (NOME_DATE, LOCAL_DATE, DIA_DATE, PERIODO_DATE, HORA_DATE) VALUES (?, ?, ?, ?, ?)';

  connection.query(query, [nome, local, data, periodo, hora], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: result.insertId });
  });
});

// 📌 ROTA 3: Salvar uma nova Ideia
app.post('/api/ideias', (req, res) => {
  const { texto } = req.body;
  const query = 'INSERT INTO ideia_date (TEXTO_IDEIA) VALUES (?)';

  connection.query(query, [texto], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: result.insertId });
  });
});

// 📌 ROTA 4: Apagar uma Ideia
app.delete('/api/ideias/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM ideia_date WHERE ID_IDEIA = ?';

  connection.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
