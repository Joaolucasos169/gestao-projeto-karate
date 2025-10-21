# 🥋 Karate Social System

## 📌 Descrição
Sistema multiplataforma (Web + Mobile) para apoio e gestão de um projeto social de Karatê, voltado a crianças de comunidades em situação de vulnerabilidade.  
O sistema permitirá gerenciar alunos, aulas, eventos, mensalidades, doações e comunicação entre professores, responsáveis e apoiadores, fortalecendo o impacto social do projeto.

---

## 🚨 Problema
O projeto social de Karatê atende crianças da comunidade, oferecendo aulas esportivas e educativas.  
Atualmente, o gerenciamento de alunos, eventos e comunicação é feito de forma manual, o que dificulta a organização, gera falhas no acompanhamento e reduz o potencial de alcance do projeto.

---

## ✅ Justificativa
A tecnologia pode potencializar o impacto do projeto social, tornando sua gestão mais eficiente, transparente e acessível.  
Este sistema contribuirá diretamente para o **ODS 11 – Cidades e Comunidades Sustentáveis**, em especial a meta **11.3 (Urbanização Inclusiva)**, ao fortalecer iniciativas comunitárias que promovem inclusão social, segurança e acesso a atividades esportivas e culturais.

---

## 🎯 Objetivos do Sistema
- **Gerenciar alunos**: cadastro, faixa, frequência e histórico de evolução.  
- **Organizar agenda de aulas e eventos**: treinos, exames de faixa e campeonatos.  
- **Controle financeiro**: mensalidades e doações (para quem pode contribuir).  
- **Área do aluno/responsável**: acompanhamento de presença, progressão e mensagens dos professores.  
- **Plataforma comunitária**: conexão de voluntários, doadores e apoiadores ao projeto.  
- **Versão mobile**: facilitar o acesso de pais e responsáveis às informações.  

---

## 📍 Escopo do Projeto
### Incluído
- Módulo administrativo (gestão de alunos, eventos e finanças).  
- Portal web para professores e administradores.  
- Aplicativo mobile para alunos e responsáveis.  
- Integração com banco de dados centralizado.  
- APIs documentadas para comunicação entre frontend e backend.  

### Não incluído nesta etapa
- Implementação prática (será feita na Etapa 2 – N708).  
- Integrações financeiras reais (serão simuladas).  

---

## 🏗️ Visão Geral da Arquitetura
A solução seguirá o padrão **MVC (Model-View-Controller)** com separação clara de camadas:

- **Frontend Web (View):** React.js  
- **Mobile (View):** React Native  
- **Backend (Controller + lógica de negócio):** Python com Flask  
- **Model:** Banco de Dados relacional PostgreSQL  
- **APIs:** RESTful APIs para comunicação entre backend, web e mobile  

### 🔹 Diagrama Simplificado

---

## 🛠️ Tecnologias Propostas
- **Frontend Web:** React.js  
- **Mobile:** React Native  
- **Backend:** Python (Flask)  
- **Banco de Dados:** PostgreSQL  
- **Hospedagem:**  
  - Vercel (frontend web)  
  - Railway (backend e banco de dados)  
- **Padrão Arquitetural:** MVC + boas práticas de separação de camadas  

---

## 📅 Cronograma – Etapa 2 (N708)
| Semana | Atividade |
|--------|------------|
| 1      | Configuração do repositório, setup inicial do backend e frontend |
| 2      | Implementação do módulo de autenticação (login e cadastro) |
| 3      | Desenvolvimento do módulo de gestão de alunos |
| 4      | Implementação da agenda de aulas e eventos |
| 5      | Módulo financeiro (mensalidades/doações) |
| 6      | Integração com mobile (React Native) |
| 7      | Testes, ajustes e documentação final |

---

## 👥 Equipe
- **Kamila** – Levantamento de requisitos  
- **Ellen** – Levantamento de requisitos  
- **Marcondes** – Documentação de APIs e cronograma  
- **João Lucas** – Arquitetura, modelagem de banco de dados e definição de tecnologias  
- **Carlos** – Planejamento de testes e validação  
- **Nicolas** – Protótipos de interface (web e mobile)  

---

## 🌍 Conexão com o ODS 11
Este projeto se conecta ao **ODS 11 – Cidades e Comunidades Sustentáveis**, promovendo **inclusão social e urbanização inclusiva** (meta 11.3), ao apoiar iniciativas comunitárias que oferecem atividades esportivas e culturais para crianças de comunidades.  
Assim, contribui para cidades mais **justas, seguras e sustentáveis** por meio da tecnologia.

