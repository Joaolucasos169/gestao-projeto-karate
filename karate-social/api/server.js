import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import studentsRoutes from './routes/students.js'

dotenv.config()
const app = express()

// ✅ Configuração de CORS (liberada para ambiente local)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Libera o frontend local
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ✅ Habilita JSON
app.use(express.json())

// ✅ Rota de teste (verificar se API está online)
app.get('/health', (req, res) => res.json({ ok: true }))

// ✅ Rotas principais
app.use('/auth', authRoutes)
app.use('/students', studentsRoutes)

// ✅ Tratamento básico de erro (evita travamentos)
app.use((err, req, res, next) => {
  console.error('🚨 Erro no servidor:', err)
  res.status(500).json({ error: 'Erro interno do servidor.' })
})

// ✅ Inicialização
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`)
})
