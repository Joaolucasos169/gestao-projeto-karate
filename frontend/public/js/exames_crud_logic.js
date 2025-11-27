// ==================== CONFIGURAÇÃO ====================
const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

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
  setTimeout(() => el.style.display = 'none', 4000);
}

// Variáveis de Estado
let allAlunos = [];
let selectedStudents = []; // Array de IDs (inteiros)

// ==================== CARREGAR ALUNOS ====================
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Carregando alunos...</td></tr>`;

  try {
    // Busca alunos na API
    const res = await fetch(`${API_BASE}/alunos/`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if (!res.ok) throw new Error("Falha ao buscar alunos");

    allAlunos = await res.json();
    renderAlunos();

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 py-4">Erro ao carregar lista de alunos.</td></tr>`;
  }
}

// Renderiza a tabela de seleção de alunos
function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";

  if (!allAlunos || allAlunos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum aluno encontrado.</td></tr>`;
    return;
  }

  allAlunos.forEach(aluno => {
    const isSelected = selectedStudents.includes(aluno.id);
    const btnClass = isSelected ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700";
    const btnText = isSelected ? "Selecionado" : "Adicionar";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${aluno.nome}</td>
      <td class="px-6 py-4 whitespace-nowrap">${aluno.data_nascimento || "-"}</td>
      <td class="px-6 py-4 whitespace-nowrap">${aluno.grau_atual || "Branca"}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button id="btn-aluno-${aluno.id}" type="button" 
          class="${btnClass} text-white px-3 py-1 rounded transition-colors text-sm font-medium" 
          onclick="toggleStudentSelection(${aluno.id})">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateCount();
}

// ==================== LÓGICA DE SELEÇÃO ====================
function toggleStudentSelection(id) {
  if (selectedStudents.includes(id)) {
    selectedStudents = selectedStudents.filter(sId => sId !== id);
  } else {
    selectedStudents.push(id);
  }
  renderAlunos(); 
}

function updateCount() {
  const el = document.getElementById('contador-selecionados');
  if(el) el.textContent = `(${selectedStudents.length})`;
}

// Abre o modal para ver quem foi selecionado
function abrirModalSelecionados() {
  const modal = document.getElementById('modal-selecionados');
  const lista = document.getElementById('lista-alunos-selecionados');
  
  if (!modal || !lista) return;

  const alunosDetalhados = allAlunos.filter(a => selectedStudents.includes(a.id));
  
  lista.innerHTML = "";
  if (alunosDetalhados.length === 0) {
    lista.innerHTML = "<li class='text-gray-500 text-center'>Nenhum aluno selecionado.</li>";
  } else {
    alunosDetalhados.forEach(aluno => {
      const li = document.createElement('li');
      li.className = "flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200";
      li.innerHTML = `
        <span class="font-medium text-gray-700">${aluno.nome} <small class="text-gray-500">(${aluno.faixa || 'Sem faixa'})</small></span>
        <button onclick="toggleStudentSelection(${aluno.id}); abrirModalSelecionados();" class="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
      `;
      lista.appendChild(li);
    });
  }
  modal.classList.remove('hidden');
}

function fecharModalSelecionados() {
  document.getElementById('modal-selecionados').classList.add('hidden');
}

// ==================== CRIAR EXAME (POST) ====================
async function createExame() {
  const nome = document.getElementById('exame_nome').value.trim();
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value.trim();

  // Validação Frontend
  if (!nome || !data || !hora || !local) {
    showFeedback("Preencha todos os campos obrigatórios (*)", "error");
    return;
  }
  if (selectedStudents.length === 0) {
    showFeedback("Selecione pelo menos um aluno na lista.", "error");
    return;
  }

  // Payload EXATAMENTE como seu controller Python espera
  const payload = {
    nome_evento: nome,
    data: data,        // String YYYY-MM-DD
    hora: hora,        // String HH:MM
    local: local,
    alunos_ids: selectedStudents // Array de Inteiros [1, 2, 5]
  };

  const btnSalvar = document.getElementById('btn-salvar-exame');
  if(btnSalvar) { btnSalvar.textContent = "Salvando..."; btnSalvar.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/exames/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${getToken()}` 
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Erro ao criar exame");

    showFeedback("Exame criado com sucesso!");
    
    // Resetar tudo
    selectedStudents = [];
    document.getElementById('form-exame').reset();
    fecharModalSelecionados();
    renderAlunos();
    loadExames();

  } catch (err) {
    console.error(err);
    showFeedback(err.message, "error");
  } finally {
    if(btnSalvar) { btnSalvar.innerHTML = `<i data-feather="check"></i> Criar Exame`; btnSalvar.disabled = false; feather.replace(); }
  }
}

// ==================== LISTAR EXAMES (GET) ====================
async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Carregando histórico...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/exames/`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if(!res.ok) throw new Error("Erro ao listar exames");

    const exames = await res.json();
    
    tbody.innerHTML = "";
    if(exames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum exame registrado.</td></tr>`;
        return;
    }

    exames.forEach(exame => {
      // O backend retorna 'alunos' (lista de objetos) graças ao to_json(include_alunos=True)
      const listaNomes = (exame.alunos || []).map(a => a.nome).join(", ");
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm font-medium text-gray-900">${exame.nome_evento}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${exame.data} às ${exame.hora}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${exame.local}</td>
        <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title="${listaNomes}">
           ${listaNomes.length > 50 ? listaNomes.substring(0, 50) + '...' : (listaNomes || 'Nenhum aluno')}
        </td>
        <td class="px-6 py-4 text-sm font-medium">
          <button onclick="excluirExame(${exame.id})" class="text-red-600 hover:text-red-900">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Falha ao carregar exames.</td></tr>`;
  }
}

// ==================== EXCLUIR EXAME (DELETE) ====================
async function excluirExame(id) {
    if(!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
        const res = await fetch(`${API_BASE}/exames/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        if(res.ok) {
            showFeedback("Exame excluído.");
            loadExames();
        } else {
            showFeedback("Erro ao excluir.", "error");
        }
    } catch(e) {
        showFeedback("Erro de conexão.", "error");
    }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  // Verifica login
  if (!getToken()) {
      window.location.href = 'index.html';
      return;
  }

  loadAlunos();
  loadExames();

  // Liga os Event Listeners aos IDs do HTML
  const btnVisualizar = document.getElementById("btn-visualizar-selecionados");
  if(btnVisualizar) btnVisualizar.addEventListener("click", abrirModalSelecionados);

  const btnFechar = document.getElementById("btn-fechar-modal");
  if(btnFechar) btnFechar.addEventListener("click", fecharModalSelecionados);

  const btnCriar = document.getElementById("btn-salvar-exame");
  if(btnCriar) btnCriar.addEventListener("click", createExame);
});