const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

function getToken() { return localStorage.getItem('token'); }

function showFeedback(msg, type = 'success') {
  const el = document.getElementById('feedback-message');
  el.textContent = msg;
  el.className = 'feedback-message p-4 rounded-md text-sm ' +
    (type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

let allAlunos = [];
let selectedStudents = [];

// ---------------------
// CARREGAR ALUNOS
// ---------------------
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center">Carregando alunos...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/alunos`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if (!res.ok) throw new Error("Erro ao carregar alunos");

    allAlunos = await res.json();
    renderAlunos();

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-500">Erro ao carregar alunos.</td></tr>`;
  }
}

function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";

  if (!allAlunos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center">Nenhum aluno cadastrado.</td></tr>`;
    return;
  }

  allAlunos.forEach(aluno => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${aluno.nome}</td>
      <td>${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString() : "—"}</td>
      <td>${aluno.faixa || "—"}</td>
      <td><button class="bg-indigo-600 text-white px-3 py-1 rounded" onclick="addToSelected(${aluno.id})">Adicionar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function addToSelected(id) {
  if (!selectedStudents.includes(id)) {
    selectedStudents.push(id);
    showFeedback("Aluno adicionado.");
  } else {
    showFeedback("Aluno já está selecionado!", "error");
  }
}

// ---------------------
// CRIAR EXAME
// ---------------------
async function createExame() {
  const nome = document.getElementById('exame_nome').value.trim();
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value.trim();

  if (!nome || !data || !hora || !local) {
    showFeedback("Preencha todos os campos!", "error");
    return;
  }

  if (!selectedStudents.length) {
    showFeedback("Selecione pelo menos um aluno!", "error");
    return;
  }

  const payload = {
    nome_evento: nome,
    data,
    hora,
    local,
    alunos_ids: selectedStudents
  };

  try {
    const res = await fetch(`${API_BASE}/exames`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    showFeedback("Exame criado com sucesso!");

    // reset
    selectedStudents = [];
    document.getElementById('exame_nome').value = "";
    document.getElementById('exame_data').value = "";
    document.getElementById('exame_hora').value = "";
    document.getElementById('exame_local').value = "";
    loadExames();
    closeSelectedModal();

  } catch (e) {
    console.error(e);
    showFeedback("Erro ao criar exame", "error");
  }
}

// ---------------------
// LISTAR EXAMES
// ---------------------
async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/exames`, { 
      headers: { Authorization: `Bearer ${getToken()}` } 
    });

    if (!res.ok) throw new Error("Erro ao buscar exames");

    const exames = await res.json();
    renderExames(exames);

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-red-500">Erro ao carregar exames.</td></tr>`;
  }
}

function renderExames(exames) {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = "";

  if (!exames.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center">Nenhum exame cadastrado.</td></tr>`;
    return;
  }

  exames.forEach(exame => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exame.nome_evento}</td>
      <td>${exame.data}</td>
      <td>${exame.hora}</td>
      <td>${exame.local}</td>
      <td>${(exame.alunos || []).map(a => a.nome).join(", ")}</td>
      <td>
        <button onclick="abrirEditarExame(${exame.id})" class="text-blue-600">Editar</button>
        <button onclick="excluirExame(${exame.id})" class="text-red-600 ml-2">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAlunos();
  loadExames();
  feather.replace();
});
