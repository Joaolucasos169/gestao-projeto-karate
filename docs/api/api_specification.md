# 📑 Especificação de APIs - Sistema de Gestão de Projeto Karate

Este documento descreve os endpoints previstos para o sistema de **Gestão de Projeto Karate**, seus parâmetros, formatos de resposta e requisitos de autenticação/autorização.

---

## 🔑 Autenticação

- **Método**: `POST /api/auth/login`  
- **Descrição**: Realiza login de usuário com e-mail e senha.  
- **Parâmetros**:
  - `email` (string) – obrigatório
  - `password` (string) – obrigatório  
- **Resposta (200)**:
```json
{
  "token": "jwt_token_aqui",
  "user": {
    "id": 1,
    "name": "Sensei João",
    "role": "admin"
  }
}
```
- **Erros**:
  - `401 Unauthorized` – credenciais inválidas

---

## 👤 Usuários

### Criar Usuário
- **Método**: `POST /api/users`  
- **Descrição**: Cadastra um novo usuário (aluno, sensei ou administrador).  
- **Parâmetros (body)**:
```json
{
  "name": "Maria Souza",
  "email": "maria@email.com",
  "password": "123456",
  "role": "aluno"
}
```
- **Resposta (201)**:
```json
{
  "id": 2,
  "name": "Maria Souza",
  "email": "maria@email.com",
  "role": "aluno"
}
```

### Listar Usuários
- **Método**: `GET /api/users`  
- **Autenticação**: Bearer Token (JWT, admin)  
- **Resposta (200)**:
```json
[
  {
    "id": 1,
    "name": "Sensei João",
    "email": "joao@email.com",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "Maria Souza",
    "email": "maria@email.com",
    "role": "aluno"
  }
]
```

---

## 🥋 Alunos

### Criar Aluno
- **Método**: `POST /api/alunos`  
- **Descrição**: Cadastra informações de um aluno de karate.  
- **Parâmetros (body)**:
```json
{
  "nome": "Pedro Silva",
  "faixa": "Branca",
  "idade": 12,
  "plano": "Mensal"
}
```
- **Resposta (201)**:
```json
{
  "id": 1,
  "nome": "Pedro Silva",
  "faixa": "Branca",
  "idade": 12,
  "plano": "Mensal"
}
```

### Listar Alunos
- **Método**: `GET /api/alunos`  
- **Autenticação**: JWT  
- **Resposta (200)**:
```json
[
  {
    "id": 1,
    "nome": "Pedro Silva",
    "faixa": "Branca",
    "idade": 12,
    "plano": "Mensal"
  }
]
```

---

## 🗓️ Treinos

### Criar Treino
- **Método**: `POST /api/treinos`  
- **Descrição**: Registra um novo treino na academia.  
- **Parâmetros (body)**:
```json
{
  "data": "2025-09-01",
  "descricao": "Treino de Kihon e Kata",
  "responsavel_id": 1
}
```
- **Resposta (201)**:
```json
{
  "id": 1,
  "data": "2025-09-01",
  "descricao": "Treino de Kihon e Kata",
  "responsavel_id": 1
}
```

### Listar Treinos
- **Método**: `GET /api/treinos`  
- **Autenticação**: JWT  
- **Resposta (200)**:
```json
[
  {
    "id": 1,
    "data": "2025-09-01",
    "descricao": "Treino de Kihon e Kata",
    "responsavel_id": 1
  }
]
```

---

## 🏆 Eventos e Competições

### Criar Evento
- **Método**: `POST /api/eventos`  
- **Descrição**: Cadastra um novo evento ou competição de karate.  
- **Parâmetros (body)**:
```json
{
  "nome": "Campeonato Estadual",
  "data": "2025-10-15",
  "local": "Ginásio Municipal",
  "descricao": "Competição aberta para todas as faixas"
}
```
- **Resposta (201)**:
```json
{
  "id": 1,
  "nome": "Campeonato Estadual",
  "data": "2025-10-15",
  "local": "Ginásio Municipal",
  "descricao": "Competição aberta para todas as faixas"
}
```

### Listar Eventos
- **Método**: `GET /api/eventos`  
- **Resposta (200)**:
```json
[
  {
    "id": 1,
    "nome": "Campeonato Estadual",
    "data": "2025-10-15",
    "local": "Ginásio Municipal",
    "descricao": "Competição aberta para todas as faixas"
  }
]
```

---

## 🔒 Regras de Autorização
- Apenas **administradores** podem cadastrar e excluir usuários.  
- Senseis podem cadastrar treinos e alunos.  
- Alunos podem visualizar apenas seus próprios dados e agenda de treinos/eventos.  
- Todas as rotas (exceto login e registro) exigem **JWT válido**.

---
