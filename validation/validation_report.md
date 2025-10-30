# Relatório de Validação de Hipóteses

Este documento regista as hipóteses iniciais do projeto e os resultados da validação feita com o público-alvo (Sensei Walisson Brito e pais de alunos das comunidades Cristo Redentor e Pirambu).

---

## Hipótese 1: Gestão Administrativa

**Hipótese:**  
O Sensei Walisson gasta demasiado tempo com tarefas administrativas manuais (papel, planilhas, WhatsApp), o que limita o seu tempo para o ensino e expansão do projeto.

**Método de Validação:**  
Entrevista direta com o Sensei Walisson Brito.

**Resultado:**  
Validada.

**Conclusão:**  
O Sensei confirmou que a gestão de matrículas, a cobrança de mensalidades simbólicas e o controlo de frequência são os seus maiores "ladrões de tempo". Um sistema que centralize o cadastro de alunos (com todos os dados pedidos) e automatize a lista de presença é a sua maior prioridade.

---

## Hipótese 2: Comunicação com os Pais

**Hipótese:**  
A comunicação sobre eventos, horários e necessidade de documentos (ex: atestado médico) é ineficiente através dos canais atuais (grupos de WhatsApp).

**Método de Validação:**  
Conversa informal com 5 pais/responsáveis durante um treino no Pirambu.

**Resultado:**  
Validada.

**Conclusão:**  
Os pais confirmaram que as informações importantes se perdem no fluxo dos grupos de WhatsApp. Eles gostariam de um "mural de avisos" oficial ou um local central onde pudessem verificar os horários corretos das aulas e eventos futuros.

---

## Hipótese 3: Acesso à Tecnologia e Plataforma

**Hipótese:**  
Os pais e responsáveis (público-alvo) têm acesso primário à internet via smartphones (Android, na maioria) e preferem uma aplicação (App Mobile) a um website.

**Método de Validação:**  
Pesquisa rápida (questionário simples) com os responsáveis.

**Resultado:**  
Parcialmente Validada.

**Conclusão:**  
Quase 100% dos responsáveis acedem à internet pelo telemóvel. No entanto, muitos têm receio ou dificuldade em "instalar mais uma app". Um Website Responsivo (que funcione bem no navegador do telemóvel) foi considerado mais acessível do que uma app dedicada nesta fase.

**Decisão:**  
O foco inicial será num sistema **Web 100% responsivo (Mobile-First)**.  
- Backend: Python (Flask) pela robustez e rápida prototipagem.  
- Frontend: HTML, JavaScript puro e Tailwind CSS para garantir leveza e máxima compatibilidade, eliminando frameworks pesados nesta fase inicial.

---

## Hipótese 4: Engajamento do Aluno

**Hipótese:**  
Os alunos (especialmente os mais velhos, 7+ anos) sentir-se-iam mais motivados se pudessem ver visualmente o seu progresso (faixa atual, próxima faixa, frequência).

**Método de Validação:**  
Conversa com Sensei Walisson e observação dos alunos.

**Resultado:**  
Validada.

**Conclusão:**  
O Sensei confirmou que a progressão de faixa é o maior motivador. Ter um local onde o aluno (ou os pais) possa ver a sua "jornada" (ex: "Faltam X aulas para o exame da próxima faixa") aumentaria o engajamento e reduziria a evasão.
