const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

function getToken() { return localStorage.getItem('token'); }
function showFeedback(msg, type='success') {
  const el = document.getElementById('feedback-message');
  el.textContent = msg;
  el.className = 'feedback-message p-4 rounded-md text-sm ' + (type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  el.style.display = 'block';
  setTimeout(()=> el.style.display = 'none', 3500);
}

let allAlunos = [];
let selectedStudents = [];

async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Carregando alunos...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE}/alunos/`, { headers: { Authorization: `Bearer ${getToken()}` }});
    if (!res.ok) throw new Error('Erro ao carregar alunos');
    allAlunos = await res.json();
    renderAlunos();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-500">Erro ao carregar alunos.</td></tr>`;
    console.error(err);
  }
}

function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  if (!allAlunos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Nenhum aluno cadastrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  allAlunos.forEach(aluno => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3">${aluno.nome}</td>
      <td class="px-4 py-3">${aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString() : '—'}</td>
      <td class="px-4 py-3">${aluno.faixa || '—'}</td>
      <td class="px-4 py-3">
        <button class="bg-indigo-600 text-white px-3 py-1 rounded" onclick="addToSelected(${aluno.id})">Adicionar ao exame</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
function addToSelected(id) {
  if (selectedStudents.includes(id)) {
    showFeedback('Aluno já selecionado', 'error');
    return;
  }
  selectedStudents.push(id);
  showFeedback('Aluno adicionado aos selecionados');
}

// --- Modal (visualizar selecionados) ---
function openSelectedModal() {
  const modal = document.getElementById('modalSelected');
  const list = document.getElementById('selected-list');
  list.innerHTML = '';
  if (!selectedStudents.length) {
    list.innerHTML = `<div class="text-sm text-gray-500">Nenhum aluno selecionado.</div>`;
  } else {
    selectedStudents.forEach(id => {
      const aluno = allAlunos.find(a => a.id === id);
      if (!aluno) return;
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between border-b py-2';
      div.innerHTML = `<div><strong>${aluno.nome}</strong><div class="text-xs text-gray-600">${aluno.faixa || ''}</div></div>
      <div><button class="text-red-600" onclick="removeSelected(${aluno.id})">Remover</button></div>`;
      list.appendChild(div);
    });
  }
  modal.classList.remove('hidden');
}

function closeSelectedModal() {
  document.getElementById('modalSelected').classList.add('hidden');
}

function removeSelected(id) {
  selectedStudents = selectedStudents.filter(i => i !== id);
  openSelectedModal(); 
}

// --- Criar Exame ---
async function createExame() {
  const nome = document.getElementById('exame_nome').value.trim();
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value.trim();

  if (!nome || !data || !hora || !local) {
    showFeedback('Preencha todos os campos do evento', 'error');
    return;
  }
  if (!selectedStudents.length) {
    showFeedback('Selecione pelo menos um aluno', 'error');
    return;
  }

  const payload = { nome_evento: nome, data, hora, local, alunos: selectedStudents };

  try {
    const res = await fetch(`${API_BASE}/exames/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`},
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erro ao criar exame');
    showFeedback('Exame criado com sucesso!');
    // limpar seleção e campos
    selectedStudents = [];
    document.getElementById('exame_nome').value = '';
    document.getElementById('exame_data').value = '';
    document.getElementById('exame_hora').value = '';
    document.getElementById('exame_local').value = '';
    closeSelectedModal();
    loadExames();
  } catch (err) {
    console.error(err);
    showFeedback('Erro ao criar exame', 'error');
  }
}

// --- Listar Exames ---
async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500">Carregando exames...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE}/exames/`, { headers: { Authorization: `Bearer ${getToken()}` }});
    if (!res.ok) throw new Error('Erro ao listar exames');
    const exames = await res.json();
    renderExames(exames);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-red-500">Erro ao carregar exames.</td></tr>`;
    console.error(err);
  }
}

function renderExames(exames) {
  const tbody = document.getElementById('exames-tbody');
  if (!exames.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500">Nenhum exame cadastrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  exames.forEach(ex => {
    const tr = document.createElement('tr');
    const alunosText = (ex.alunos || []).map(a => a.nome).join(', ');
    tr.innerHTML = `
      <td class="px-4 py-3">${ex.nome_evento}</td>
      <td class="px-4 py-3">${ex.data}</td>
      <td class="px-4 py-3">${ex.hora}</td>
      <td class="px-4 py-3">${ex.local}</td>
      <td class="px-4 py-3 max-w-lg truncate">${alunosText}</td>
      <td class="px-4 py-3">
        <button class="text-blue-600 mr-2" onclick="abrirEditarExame(${ex.id})">Editar</button>
        <button class="text-red-600" onclick="excluirExame(${ex.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Excluir exame ---
async function excluirExame(id) {
  if (!confirm('Deseja excluir este exame?')) return;
  try {
    const res = await fetch(`${API_BASE}/exames/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }});
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erro ao excluir');
    showFeedback('Exame excluído');
    loadExames();
  } catch (err) {
    console.error(err);
    showFeedback('Erro ao excluir exame', 'error');
  }
}

// --- Editar exame (abre modal reutilizando o selected modal) ---
async function abrirEditarExame(id) {
  try {
    const res = await fetch(`${API_BASE}/exames/${id}`, { headers: { Authorization: `Bearer ${getToken()}` }});
    if (!res.ok) throw new Error('Erro ao buscar exame');
    const exame = await res.json();

    // preencher campos com dados do exame
    document.getElementById('exame_nome').value = exame.nome_evento || '';
    document.getElementById('exame_data').value = exame.data || '';
    document.getElementById('exame_hora').value = exame.hora || '';
    document.getElementById('exame_local').value = exame.local || '';

    // carregar todos os alunos se não carregados
    if (!allAlunos.length) await loadAlunos();

    // selecionar os alunos do exame
    selectedStudents = (exame.alunos || []).map(a => a.id);

    // abrir modal para revisar
    openSelectedModal();

    // ao confirmar criação, faça PATCH ao invés de POST
    const btnConfirm = document.getElementById('btnConfirmCreate');
    btnConfirm.onclick = async () => {
      try {
        const payload = {
          nome_evento: document.getElementById('exame_nome').value.trim(),
          data: document.getElementById('exame_data').value,
          hora: document.getElementById('exame_hora').value,
          local: document.getElementById('exame_local').value,
          alunos: selectedStudents
        };
        const r = await fetch(`${API_BASE}/exames/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(payload)
        });
        const jr = await r.json();
        if (!r.ok) throw new Error(jr.message || 'Erro ao atualizar');
        showFeedback('Exame atualizado');
        closeSelectedModal();
        loadExames();
      } catch (err) {
        console.error(err);
        showFeedback('Erro ao atualizar exame', 'error');
      }
    };
  } catch (err) {
    console.error(err);
    showFeedback('Erro ao abrir edição', 'error');
  }
}

// --- Confirm create (no modal) ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnViewSelected').addEventListener('click', openSelectedModal);
  document.getElementById('closeModal').addEventListener('click', closeSelectedModal);
  document.getElementById('btnRemoveSelected').addEventListener('click', () => { selectedStudents = []; openSelectedModal(); });
  document.getElementById('btnConfirmCreate').addEventListener('click', createExame);
  document.getElementById('btnCreateExame').addEventListener('click', () => { openSelectedModal(); });

  loadAlunos();
  loadExames();

  feather.replace();
});
