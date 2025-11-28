const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

function getToken() { return localStorage.getItem('token'); }

function showFeedback(msg, type = 'success') {
  const el = document.getElementById('feedback-message');
  if (!el) return;
  el.textContent = msg;
  el.className = 'feedback-message p-4 rounded-md text-sm mb-4 border ' +
    (type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300');
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3500);
}

let allAlunos = [];
let selectedStudents = []; // Array de IDs

// ==================== 1. CARREGAR DADOS INICIAIS ====================
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4">Carregando alunos...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/alunos/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error("Erro alunos");
    allAlunos = await res.json();
    renderAlunos();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500">Erro ao carregar lista.</td></tr>`;
  }
}

async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando exames...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/exames/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const exames = await res.json();
    
    tbody.innerHTML = "";
    if(exames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum exame agendado.</td></tr>`;
        return;
    }

    exames.forEach(exame => {
        // Formata Data
        const dataFormatada = new Date(exame.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-medium">${exame.nome_evento}</td>
                <td class="px-6 py-4 text-gray-600">${dataFormatada} às ${exame.hora}</td>
                <td class="px-6 py-4 text-gray-600">${exame.qtd_alunos || 0} alunos</td>
                <td class="px-6 py-4 flex gap-2">
                    <button onclick="abrirBanca(${exame.id})" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 flex items-center gap-1">
                       🏆 Banca
                    </button>
                    <button onclick="excluirExame(${exame.id})" class="text-red-600 hover:text-red-800 text-sm flex items-center gap-1">
                       🗑 Excluir
                    </button>
                </td>
            </tr>
        `;
    });
    feather.replace();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar.</td></tr>`;
  }
}

// ==================== 2. SELEÇÃO DE ALUNOS ====================
function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";

  allAlunos.forEach(aluno => {
    const isSelected = selectedStudents.includes(aluno.id);
    const btnClass = isSelected ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700";
    const btnText = isSelected ? "Selecionado" : "Incluir";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4">${aluno.nome}</td>
      <td class="px-6 py-4">${aluno.grau_atual || "Branca"}</td>
      <td class="px-6 py-4">
        <button id="btn-aluno-${aluno.id}" class="${btnClass} text-white px-3 py-1 rounded text-sm transition" 
          onclick="toggleStudent(${aluno.id})">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateCounter();
}

function toggleStudent(id) {
  if (selectedStudents.includes(id)) {
    selectedStudents = selectedStudents.filter(sId => sId !== id);
  } else {
    selectedStudents.push(id);
  }
  renderAlunos();
}

function updateCounter() {
    const el = document.getElementById('contador-selecionados');
    if(el) el.textContent = `(${selectedStudents.length})`;
}

// ==================== 3. CRIAR EXAME ====================
async function createExame() {
  const nome = document.getElementById('exame_nome').value;
  const data = document.getElementById('exame_data').value;
  const hora = document.getElementById('exame_hora').value;
  const local = document.getElementById('exame_local').value;

  if (!nome || !data || !hora || !local) return showFeedback("Preencha todos os campos!", "error");
  if (selectedStudents.length === 0) return showFeedback("Selecione alunos!", "error");

  const payload = { nome_evento: nome, data, hora, local, alunos_ids: selectedStudents };

  try {
    const res = await fetch(`${API_BASE}/exames/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showFeedback("Exame criado!");
      selectedStudents = [];
      document.getElementById('form-exame').reset();
      renderAlunos();
      loadExames();
    } else {
      showFeedback("Erro ao criar.", "error");
    }
  } catch (e) {
    showFeedback("Erro de conexão.", "error");
  }
}

// ==================== 4. BANCA AVALIADORA (A Mágica) ====================
async function abrirBanca(exameId) {
    const modal = document.getElementById('modal-banca');
    const tbody = document.getElementById('tbody-banca');
    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10">Carregando alunos...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/exames/${exameId}/banca`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const inscricoes = await res.json();

        tbody.innerHTML = '';
        if(inscricoes.length === 0) {
             tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-gray-500">Nenhum aluno inscrito.</td></tr>';
             return;
        }

        inscricoes.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "border-b hover:bg-indigo-50 transition";
            
            const corMedia = item.media >= 6.0 ? 'text-green-600' : 'text-red-600';
            const statusBadge = item.aprovado 
                ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">APROVADO</span>`
                : `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">REPROVADO</span>`;

            tr.innerHTML = `
                <td class="py-3 px-4 font-medium">${item.aluno_nome} <br><span class="text-xs text-gray-400">${item.aluno_faixa}</span></td>
                
                <td class="p-2"><input type="number" step="0.1" min="0" max="10" id="k-${item.id}" value="${item.notas.kihon}" class="w-full border p-1 rounded text-center focus:ring-2 ring-indigo-500" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.1" min="0" max="10" id="ka-${item.id}" value="${item.notas.kata}" class="w-full border p-1 rounded text-center focus:ring-2 ring-indigo-500" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.1" min="0" max="10" id="ku-${item.id}" value="${item.notas.kumite}" class="w-full border p-1 rounded text-center focus:ring-2 ring-indigo-500" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.1" min="0" max="10" id="g-${item.id}" value="${item.notas.gerais}" class="w-full border p-1 rounded text-center focus:ring-2 ring-indigo-500" onchange="calcMedia(${item.id})"></td>
                
                <td class="py-3 px-4 text-center font-bold text-lg ${corMedia}" id="m-${item.id}">${item.media}</td>
                <td class="py-3 px-4 text-center" id="s-${item.id}">${statusBadge}</td>
                
                <td class="py-3 px-4 text-center">
                    <button onclick="salvarNota(${item.id})" class="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 shadow">
                        <i data-feather="save" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        feather.replace();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-red-500">Erro ao carregar.</td></tr>';
    }
}

// Calculadora Visual
function calcMedia(id) {
    const k = parseFloat(document.getElementById(`k-${id}`).value) || 0;
    const ka = parseFloat(document.getElementById(`ka-${id}`).value) || 0;
    const ku = parseFloat(document.getElementById(`ku-${id}`).value) || 0;
    const g = parseFloat(document.getElementById(`g-${id}`).value) || 0;

    const media = ((k + ka + ku + g) / 4).toFixed(1);
    
    const elMedia = document.getElementById(`m-${id}`);
    const elStatus = document.getElementById(`s-${id}`);

    elMedia.textContent = media;
    
    if (media >= 6.0) {
        elMedia.className = "py-3 px-4 text-center font-bold text-lg text-green-600";
        elStatus.innerHTML = `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">APROVADO</span>`;
    } else {
        elMedia.className = "py-3 px-4 text-center font-bold text-lg text-red-600";
        elStatus.innerHTML = `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">REPROVADO</span>`;
    }
}

async function salvarNota(inscricaoId) {
    const payload = {
        kihon: document.getElementById(`k-${inscricaoId}`).value,
        kata: document.getElementById(`ka-${inscricaoId}`).value,
        kumite: document.getElementById(`ku-${inscricaoId}`).value,
        gerais: document.getElementById(`g-${inscricaoId}`).value
    };

    try {
        const res = await fetch(`${API_BASE}/exames/notas/${inscricaoId}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify(payload)
        });

        if(res.ok) alert("Nota salva com sucesso!");
        else alert("Erro ao salvar.");
    } catch(e) {
        alert("Erro de conexão.");
    }
}

function fecharBanca() {
    document.getElementById('modal-banca').classList.add('hidden');
}

// Excluir
async function excluirExame(id) {
    if(!confirm("Excluir este exame?")) return;
    try {
        await fetch(`${API_BASE}/exames/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
        loadExames();
    } catch {}
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  if(getToken()) {
      loadAlunos();
      loadExames();
  }
  
  const btnVisualizar = document.getElementById("btn-visualizar-selecionados");
  if(btnVisualizar) {
      btnVisualizar.addEventListener("click", () => {
          const modal = document.getElementById('modal-selecionados');
          const lista = document.getElementById('lista-alunos-selecionados');
          lista.innerHTML = "";
          
          const selecionados = allAlunos.filter(a => selectedStudents.includes(a.id));
          if(selecionados.length === 0) lista.innerHTML = "<li>Nenhum selecionado</li>";
          
          selecionados.forEach(a => {
              lista.innerHTML += `<li class="flex justify-between p-2 border-b"><span>${a.nome}</span> <button onclick="toggleStudent(${a.id}); document.getElementById('btn-visualizar-selecionados').click()" class="text-red-500">✖</button></li>`;
          });
          modal.classList.remove('hidden');
      });
  }

  const btnSalvar = document.getElementById("btn-salvar-exame");
  if(btnSalvar) btnSalvar.addEventListener("click", createExame);
});