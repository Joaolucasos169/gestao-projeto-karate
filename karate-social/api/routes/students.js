import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// todas as rotas de alunos exigem login
router.use(authMiddleware);

// Listar alunos
router.get('/', (req, res) => {
  db.all('SELECT * FROM students ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar alunos' });
    res.json(rows);
  });
});

// Criar novo aluno
router.post('/', (req, res) => {
  const { name, belt = 'white', birthdate = null, guardian_id = null, notes = null } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  db.run(
    'INSERT INTO students (name, belt, birthdate, guardian_id, notes) VALUES (?,?,?,?,?)',
    [name, belt, birthdate, guardian_id, notes],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar aluno' });
      res.json({ id: this.lastID, name, belt, birthdate, guardian_id, notes });
    }
  );
});

// 👉 linha essencial para corrigir o erro:
export default router;
