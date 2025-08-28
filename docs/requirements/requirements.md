# 📌 Requisitos do Sistema – Karate Social System

## 1. Requisitos Funcionais (RF)
- RF01 – O sistema deve permitir o cadastro de alunos.  
- RF02 – O sistema deve gerenciar a frequência e evolução de faixas.  
- RF03 – O sistema deve permitir cadastro de aulas, exames e campeonatos.  
- RF04 – O sistema deve disponibilizar agenda de eventos para os alunos.  
- RF05 – O sistema deve registrar mensalidades e doações.  
- RF06 – O sistema deve permitir comunicação entre professores e responsáveis.  
- RF07 – O sistema deve disponibilizar acesso mobile para alunos/responsáveis.  

## 2. Requisitos Não Funcionais (RNF)
- RNF01 – O sistema deve ser multiplataforma (web e mobile).  
- RNF02 – O sistema deve ser responsivo e acessível.  
- RNF03 – O backend deve disponibilizar APIs REST.  
- RNF04 – O sistema deve utilizar banco de dados relacional (PostgreSQL).  
- RNF05 – O sistema deve garantir autenticação e autorização seguras (JWT).  

## 3. Regras de Negócio
- RN01 – Cada aluno terá vinculado seu histórico de faixas.  
- RN02 – Eventos só podem ser cadastrados por administradores/professores.  
- RN03 – O sistema deve permitir doações mesmo para não-alunos.  

## 4. Perfis de Usuários
- Administrador (professores/gestores)  
- Responsável (pais/mães)  
- Aluno  

## 5. Histórias de Usuário
- **Como professor**, quero cadastrar alunos para acompanhar frequência e evolução.  
- **Como responsável**, quero acessar o histórico de presença do meu filho.  
- **Como administrador**, quero cadastrar eventos de exames de faixa.  
- **Como apoiador**, quero realizar uma doação para o projeto.
