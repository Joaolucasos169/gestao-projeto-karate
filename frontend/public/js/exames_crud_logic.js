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
let selectedStudents = [];

// ==================== CARREGAR ALUNOS ====================
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Carregando alunos...</td></tr>`;

  try {
    // CORREÇÃO: Adicionada a barra "/" no final da URL
    const res = await fetch(`${API_BASE}/alunos/`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if (!res.ok) throw new Error("Erro ao carregar alunos");

    allAlunos = await res.json();
    renderAlunos();

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-500">Erro ao carregar lista de alunos.</td></tr>`;
  }
}

function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";

  if (!allAlunos || allAlunos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Nenhum aluno cadastrado.</td></tr>`;
    return;
  }

  allAlunos.forEach(aluno => {
    // Verifica se o aluno já está selecionado para manter o botão visualmente correto
    const isSelected = selectedStudents.includes(aluno.id);
    const btnClass = isSelected ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700";
    const btnText = isSelected ? "Selecionado" : "Adicionar";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${aluno.nome}</td>
      <td class="px-6 py-4 whitespace-nowrap">${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : "—"}</td>
      <td class="px-6 py-4 whitespace-nowrap">${aluno.faixa || "—"}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button id="btn-aluno-${aluno.id}" class="${btnClass} text-white px-3 py-1 rounded transition-colors" 
          onclick="toggleStudentSelection(${aluno.id})">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Função melhorada para selecionar/deselecionar
function toggleStudentSelection(id) {
  const btn = document.getElementById(`btn-aluno-${id}`);
  
  if (selectedStudents.includes(id)) {
    // Remover
    selectedStudents = selectedStudents.filter(sId => sId !== id);
    if (btn) {
      btn.textContent = "Adicionar";
      btn.className = "bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors";
    }
  } else {
    // Adicionar
    selectedStudents.push(id);
    if (btn) {
      btn.textContent = "Selecionado";
      btn.className = "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors";
    }
  }
}

// ==================== CRIAR EXAME ====================
async function createExame() {
  const nome = document.getElementById('exame_nome').value.trim();
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value.trim();

  if (!nome || !data || !hora || !local) {
    showFeedback("Preencha todos os campos obrigatórios!", "error");
    return;
  }

  if (selectedStudents.length === 0) {
    showFeedback("Selecione pelo menos um aluno para o exame!", "error");
    return;
  }

  const payload = {
    nome_evento: nome,
    data: data,
    hora: hora,
    local: local,
    alunos_ids: selectedStudents
  };

  const btnSalvar = document.querySelector("button[onclick='createExame()']");
  if(btnSalvar) btnSalvar.textContent = "Salvando...";

  try {
    // CORREÇÃO: Adicionada a barra "/" no final da URL
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

    // Resetar formulário
    selectedStudents = [];
    document.getElementById('exame_nome').value = "";
    document.getElementById('exame_data').value = "";
    document.getElementById('exame_hora').value = "";
    document.getElementById('exame_local').value = "";
    
    // Recarregar listas
    loadExames();
    renderAlunos(); // Reseta os botões dos alunos
    
    // Se você tiver uma função para fechar o modal, chame-a aqui
    // closeSelectedModal(); 

  } catch (e) {
    console.error(e);
    showFeedback(e.message || "Erro ao conectar com o servidor", "error");
  } finally {
    if(btnSalvar) btnSalvar.textContent = "Salvar Exame";
  }
}

// ==================== LISTAR EXAMES ====================
async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  if(!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500">Carregando exames...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/exames/`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if (!res.ok) throw new Error("Erro ao buscar exames");

    const exames = await res.json();
    renderExames(exames);

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-red-500">Erro ao carregar exames.</td></tr>`;
  }
}

function renderExames(exames) {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = "";

  if (!exames || exames.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500">Nenhum exame cadastrado.</td></tr>`;
    return;
  }

  exames.forEach(exame => {
    // Formatar data para PT-BR
    const dataFormatada = exame.data ? new Date(exame.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-';
    
    // Listar nomes dos alunos (trata caso venha nulo)
    const listaAlunos = (exame.alunos || []).map(a => a.nome).join(", ");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${exame.nome_evento}</td>
      <td class="px-6 py-4 whitespace-nowrap">${dataFormatada}</td>
      <td class="px-6 py-4 whitespace-nowrap">${exame.hora}</td>
      <td class="px-6 py-4 whitespace-nowrap">${exame.local}</td>
      <td class="px-6 py-4 block min-w-[200px] truncate" title="${listaAlunos}">
        ${listaAlunos.length > 30 ? listaAlunos.substring(0, 30) + '...' : listaAlunos}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="alert('Função de editar ainda não implementada para ID ${exame.id}')" class="text-blue-600 hover:text-blue-800 mr-3">✏️ Editar</button>
        <button onclick="excluirExame(${exame.id})" class="text-red-600 hover:text-red-800">🗑 Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== EXCLUIR EXAME (Adicionado para completar) ====================
async function excluirExame(id) {
    if(!confirm("Tem certeza que deseja excluir este exame?")) return;

    try {
        const res = await fetch(`${API_BASE}/exames/${id}`, { 
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (res.ok) {
            showFeedback("Exame excluído com sucesso!");
            loadExames();
        } else {
            showFeedback("Erro ao excluir exame.", "error");
        }
    } catch (error) {
        console.error(error);
        showFeedback("Erro de conexão.", "error");
    }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  if(getToken()) {
      loadAlunos();
      loadExames();
  } else {
  }
  
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
});