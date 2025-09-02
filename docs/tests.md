# ✅ Plano de Testes e Validação – Karate Social System

Este documento define a estratégia de testes e os critérios de validação do sistema **Karate Social System**, garantindo que os requisitos funcionais e não-funcionais sejam atendidos.

---

## 1. Objetivos do Plano de Testes
- Verificar se o sistema atende aos requisitos funcionais e não-funcionais definidos em `requirements.md`.
- Garantir a qualidade da experiência do usuário em web e mobile.
- Avaliar a segurança dos dados, autenticação e permissões de acesso.
- Definir critérios claros para considerar cada requisito como concluído.

---

## 2. Tipos de Testes

### 🔹 2.1 Testes Funcionais
Avaliam se cada funcionalidade implementada atende ao esperado.
- **Cadastro de Alunos**: inserir novo aluno e validar se os dados aparecem corretamente no banco.
- **Registro de Frequência**: marcar presença do aluno e verificar se aparece no histórico.
- **Cadastro de Eventos**: criar campeonato/exame e verificar exibição no calendário.
- **Controle de Doações**: realizar registro de doação e validar se o valor foi salvo corretamente.
- **Comunicação Professor–Responsável**: enviar mensagem e verificar recebimento.

---

### 🔹 2.2 Testes de Usabilidade
Avaliam a experiência do usuário em diferentes dispositivos.
- **Responsividade**: telas devem se ajustar a diferentes resoluções (desktop, tablet, smartphone).
- **Mobile**: validar acesso via aplicativo React Native (Android/iOS).
- **Fluxos de Navegação**: usuário deve conseguir concluir tarefas em no máximo 3 cliques (ex: cadastrar aluno, visualizar agenda).
- **Acessibilidade**: botões e textos devem estar legíveis, com contraste adequado.

---

### 🔹 2.3 Testes de Segurança
Avaliam autenticação, autorização e proteção de dados.
- **Login Seguro**: apenas usuários válidos devem acessar o sistema.
- **Autenticação JWT**: tokens devem expirar corretamente e impedir acesso após logout.
- **Controle de Acesso**:  
  - Admin pode criar/editar/excluir alunos e eventos.  
  - Responsável só pode visualizar dados do(s) seu(s) filho(s).  
  - Aluno pode visualizar apenas seus próprios dados.  
- **Prevenção de Acessos Indevidos**: tentativas de acessar dados de outros usuários devem ser bloqueadas.

---

## 3. Critérios de Aceitação

Um requisito será considerado **concluído** quando:
1. Todas as funcionalidades descritas no requisito forem implementadas.
2. Os testes funcionais correspondentes forem executados com sucesso.
3. A usabilidade for validada em pelo menos **dois navegadores** (Chrome e Firefox) e **dois dispositivos mobile**.
4. As regras de segurança forem respeitadas (login/autorização funcionando).
5. O professor/administrador do sistema conseguir executar a ação sem erros.

---

## 4. Estratégia de Validação

- Os testes serão documentados em planilhas, com registro de: **funcionalidade**, **cenário de teste**, **passos executados**, **resultado esperado**, **resultado obtido** e **status (Aprovado/Reprovado)**.
- Validação será feita em conjunto pelos membros da equipe, com foco em garantir que os requisitos definidos no início do projeto sejam atendidos.
- Protótipos em Figma também serão utilizados como base de comparação para validar os fluxos de usuário.

---

## 5. Ferramentas de Apoio
- **Postman/Insomnia** → testes de API.  
- **Jest/Mocha** (futuro, na etapa de implementação) → testes automatizados no backend.  
- **Browser DevTools** → validação de responsividade.  
- **Checklists de usabilidade** → testes manuais em diferentes dispositivos.  

---

## 6. Cenários de Teste Alinhados aos Requisitos Funcionais

| ID   | Requisito | Funcionalidade          | Cenário de Teste | Passos | Resultado Esperado | Status |
|------|-----------|-------------------------|------------------|--------|--------------------|--------|
| CT01 | RF01      | Cadastro de Aluno       | Cadastrar novo aluno | 1. Acessar menu **Alunos** <br> 2. Preencher formulário <br> 3. Salvar | Aluno é salvo no banco e aparece na lista | A definir |
| CT02 | RF02      | Registro de Frequência  | Marcar presença do aluno | 1. Selecionar aluno <br> 2. Marcar presença <br> 3. Salvar | Frequência aparece no histórico do aluno | A definir |
| CT03 | RF03      | Cadastro de Evento      | Criar novo evento (admin) | 1. Acessar menu **Eventos** <br> 2. Preencher nome, data, local <br> 3. Salvar | Evento é exibido no calendário | A definir |
| CT04 | RF05      | Doação                  | Registrar doação | 1. Acessar menu **Doações** <br> 2. Inserir valor e dados do doador <br> 3. Salvar | Doação registrada no banco e listada em relatórios | A definir |
| CT05 | RF06      | Comunicação Professor-Responsável | Enviar mensagem | 1. Professor acessa perfil do aluno <br> 2. Envia mensagem <br> 3. Responsável acessa conta | Mensagem aparece na conta do responsável | A definir |
| CT06 | RF07      | Login                   | Login com credenciais válidas | 1. Acessar tela de login <br> 2. Inserir email e senha válidos <br> 3. Confirmar | Usuário acessa o sistema com token JWT válido | A definir |
| CT07 | RF07      | Login inválido          | Tentar login com senha errada | 1. Acessar tela de login <br> 2. Inserir email válido e senha incorreta | Sistema retorna erro `401 Unauthorized` | A definir |
| CT08 | RF07      | Controle de Acesso      | Aluno tentando acessar dados de outro aluno | 1. Fazer login como aluno <br> 2. Tentar acessar perfil de outro aluno via URL/API | Sistema bloqueia acesso (erro `403 Forbidden`) | A definir |
| CT09 | RNF01     | Usabilidade Web         | Verificar responsividade | 1. Abrir sistema em desktop <br> 2. Reduzir janela <br> 3. Acessar em celular | Interface se adapta sem perda de informações | A definir |
| CT10 | RNF02     | Usabilidade Mobile      | Acessar pelo app React Native | 1. Abrir app no celular <br> 2. Navegar até a tela de eventos | Layout é exibido corretamente e interativo | A definir |

---



