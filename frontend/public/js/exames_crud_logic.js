const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

// ==================== UTILITÁRIOS ====================
function getToken() { 
  return localStorage.getItem('token'); 
}

function showFeedback(msg, type = 'success') {
  const el = document.getElementById('feedback-message');
  if (!el) return;
  el.textContent = msg;
  el.className = 'feedback-message p-4 rounded-md text-sm mb-4 ' +
    (type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300');
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

// Variáveis Globais
let allAlunos = [];
let selectedStudents = []; // Armazena apenas os IDs

// ==================== CARREGAR DADOS ====================
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/alunos/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error("Erro ao carregar alunos");
    allAlunos = await res.json();
    renderAlunos();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar.</td></tr>`;
  }
}

async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/exames/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const exames = await res.json();
    renderExames(exames);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500">Erro.</td></tr>`;
  }
}

// ==================== RENDERIZAÇÃO ====================
function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";

  if (!allAlunos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Sem alunos.</td></tr>`;
    return;
  }

  allAlunos.forEach(aluno => {
    const isSelected = selectedStudents.includes(aluno.id);
    // Botão muda de cor se selecionado
    const btnClass = isSelected ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700";
    const btnText = isSelected ? "Selecionado" : "Adicionar";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4">${aluno.nome}</td>
      <td class="px-6 py-4">${aluno.faixa || "-"}</td>
      <td class="px-6 py-4">
        <button id="btn-aluno-${aluno.id}" class="${btnClass} text-white px-3 py-1 rounded transition" 
          onclick="toggleStudentSelection(${aluno.id})">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Atualiza contador no botão de visualizar (se existir)
  const contadorEl = document.getElementById('contador-selecionados');
  if(contadorEl) contadorEl.textContent = `(${selectedStudents.length})`;
}

function renderExames(exames) {
    const tbody = document.getElementById('exames-tbody');
    tbody.innerHTML = "";
    exames.forEach(exame => {
        const nomes = (exame.alunos || []).map(a => a.nome).join(", ");
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">${exame.nome_evento}</td>
            <td class="px-6 py-4">${exame.data}</td>
            <td class="px-6 py-4 truncate max-w-xs" title="${nomes}">${nomes}</td>
            <td class="px-6 py-4">
                <button onclick="excluirExame(${exame.id})" class="text-red-600 hover:underline">Excluir</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== LÓGICA DE SELEÇÃO E MODAL ====================

// 1. Selecionar/Deselecionar Aluno
function toggleStudentSelection(id) {
  if (selectedStudents.includes(id)) {
    selectedStudents = selectedStudents.filter(sId => sId !== id);
  } else {
    selectedStudents.push(id);
  }
  renderAlunos(); // Re-renderiza para atualizar as cores dos botões
}

// 2. Abrir Modal de Visualização (CORREÇÃO DO SEU PROBLEMA)
function abrirModalSelecionados() {
  const modal = document.getElementById('modal-selecionados');
  const lista = document.getElementById('lista-alunos-selecionados');
  
  if (!modal || !lista) {
      console.error("Modal ou Lista não encontrados no HTML (Verifique os IDs)");
      return;
  }

  // Filtra os objetos completos dos alunos baseados nos IDs selecionados
  const alunosDetalhados = allAlunos.filter(aluno => selectedStudents.includes(aluno.id));

  lista.innerHTML = "";
  if (alunosDetalhados.length === 0) {
    lista.innerHTML = "<li class='text-gray-500'>Nenhum aluno selecionado.</li>";
  } else {
    alunosDetalhados.forEach(aluno => {
      const li = document.createElement('li');
      li.className = "flex justify-between items-center bg-gray-50 p-2 mb-2 rounded border";
      li.innerHTML = `
        <span>${aluno.nome} (${aluno.faixa})</span>
        <button onclick="toggleStudentSelection(${aluno.id}); abrirModalSelecionados();" class="text-red-500 hover:text-red-700 font-bold">✕</button>
      `;
      lista.appendChild(li);
    });
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex'; // Garante que apareça
}

// 3. Fechar Modal
function fecharModalSelecionados() {
  const modal = document.getElementById('modal-selecionados');
  if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
  }
}

// ==================== AÇÕES DE CRUD ====================
async function createExame(event) {
  if (event) event.preventDefault(); // Evita recarregar a página se estiver num form

  const nome = document.getElementById('exame_nome').value;
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value;

  if (!nome || !data || !hora || !local) {
    showFeedback("Preencha todos os campos!", "error");
    return;
  }
  if (selectedStudents.length === 0) {
    showFeedback("Selecione alunos na tabela abaixo!", "error");
    return;
  }

  const payload = {
    nome_evento: nome,
    data, hora, local,
    alunos_ids: selectedStudents
  };

  try {
    const res = await fetch(`${API_BASE}/exames/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showFeedback("Exame criado!");
      selectedStudents = [];
      document.getElementById('exame-form').reset(); // Reseta inputs
      fecharModalSelecionados();
      loadExames();
      renderAlunos();
    } else {
      showFeedback("Erro ao criar.", "error");
    }
  } catch (e) {
    console.error(e);
    showFeedback("Erro de conexão.", "error");
  }
}

async function excluirExame(id) {
    if(!confirm("Excluir este exame?")) return;
    try {
        await fetch(`${API_BASE}/exames/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
        loadExames();
    } catch (e) { console.error(e); }
}

// ==================== INICIALIZAÇÃO (LIGAÇÃO DOS BOTÕES) ====================
document.addEventListener("DOMContentLoaded", () => {
  loadAlunos();
  loadExames();

  // Liga o botão de "Visualizar Selecionados"
  const btnVisualizar = document.getElementById("btn-visualizar-selecionados");
  if (btnVisualizar) {
      btnVisualizar.addEventListener("click", abrirModalSelecionados);
  } else {
      console.warn("Botão 'btn-visualizar-selecionados' não encontrado no HTML");
  }

  // Liga o botão de fechar modal
  const btnFecharModal = document.getElementById("btn-fechar-modal");
  if (btnFecharModal) {
      btnFecharModal.addEventListener("click", fecharModalSelecionados);
  }

  // Liga o botão de salvar exame
  const btnSalvar = document.getElementById("btn-salvar-exame");
  if (btnSalvar) {
      btnSalvar.addEventListener("click", createExame);
  }
});