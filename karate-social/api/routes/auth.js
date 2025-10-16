import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'

const router = express.Router()

// 🔑 Função auxiliar para gerar token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'segredo-super-seguro',
    { expiresIn: '1h' }
  )
}

// 🔒 Middleware de autenticação (verifica o token JWT)
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' })
  }

  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.JWT_SECRET || 'segredo-super-seguro', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido.' })
    }
    req.user = decoded
    next()
  })
}

// 🔑 Rota de Login (corrigida e única)
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' })
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    try {
      if (err) {
        console.error('Erro ao consultar banco:', err)
        return res.status(500).json({ error: 'Erro interno no servidor.' })
      }

      if (!user) {
        console.warn('Usuário não encontrado:', email)
        return res.status(401).json({ error: 'Usuário não encontrado.' })
      }

      // ✅ Valida a senha com bcrypt
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        console.warn('Senha incorreta para o usuário:', email)
        return res.status(401).json({ error: 'Senha incorreta.' })
      }

      // ✅ Gera token JWT
      const token = generateToken(user)
      console.log('✅ Login bem-sucedido para', email)
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
    } catch (e) {
      console.error('Erro no login:', e)
      return res.status(500).json({ error: 'Erro no login.' })
    }
  })
})

// 🔎 Rota opcional para verificar o token
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token ausente.' })

  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.JWT_SECRET || 'segredo-super-seguro', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido.' })
    res.json({ valid: true, user: decoded })
  })
})

export default router
