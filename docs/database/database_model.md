# 🗄️ Modelo de Dados – Karate Social System

## 1. Entidades Principais
- **Aluno** (id, nome, faixa, frequência, histórico, responsável_id)  
- **Responsável** (id, nome, contato, email, aluno_id)  
- **Evento** (id, nome, tipo, data, descrição)  
- **Doação** (id, valor, data, doador)  
- **Usuário** (id, nome, email, senha, perfil)  

## 2. Relacionamentos
- Um aluno pertence a um responsável.  
- Um aluno pode participar de vários eventos.  
- Uma doação pode ser associada a um responsável ou apoiador externo.  

## 3. Diagrama ER (a ser feito no dbdiagram.io ou draw.io)
(Colocar imagem ou link do diagrama aqui)

## 4. Dicionário de Dados
| Entidade   | Campo        | Tipo        | Descrição |
|------------|-------------|------------|-----------|
| Aluno      | id          | int (PK)   | Identificador único |
| Aluno      | nome        | varchar    | Nome do aluno |
| Aluno      | faixa       | varchar    | Faixa atual |
| Evento     | id          | int (PK)   | Identificador do evento |
| Evento     | nome        | varchar    | Nome do evento |
| Evento     | tipo        | varchar    | Tipo (aula, exame, campeonato) |
| Doação     | valor       | decimal    | Valor da doação |
