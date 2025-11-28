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
let selectedStudents = []; 

// ==================== LOADERS ====================
async function loadAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4">Carregando...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE}/alunos/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error();
    allAlunos = await res.json();
    renderAlunos();
  } catch {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500">Erro ao carregar alunos.</td></tr>`;
  }
}

async function loadExames() {
  const tbody = document.getElementById('exames-tbody');
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
  try {
    const res = await fetch(`${API_BASE}/exames/`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const exames = await res.json();
    tbody.innerHTML = "";
    
    if(exames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum exame.</td></tr>`;
        return;
    }

    exames.forEach(ex => {
        const dataF = new Date(ex.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="px-6 py-4 font-medium">${ex.nome_evento}</td>
                <td class="px-6 py-4 text-gray-600">${dataF} - ${ex.hora}</td>
                <td class="px-6 py-4 text-gray-600">${ex.qtd_alunos} inscritos</td>
                <td class="px-6 py-4 flex gap-2">
                    <button onclick="abrirBanca(${ex.id})" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 flex items-center gap-1">
                       🏆 Banca
                    </button>
                    <button onclick="excluirExame(${ex.id})" class="text-red-600 hover:text-red-800 text-sm flex items-center gap-1">
                       🗑 Excluir
                    </button>
                </td>
            </tr>`;
    });
    if(typeof feather !== 'undefined') feather.replace();
  } catch {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar exames.</td></tr>`;
  }
}

// ==================== SELEÇÃO ALUNOS ====================
function renderAlunos() {
  const tbody = document.getElementById('alunos-tbody');
  tbody.innerHTML = "";
  allAlunos.forEach(aluno => {
    const isSel = selectedStudents.includes(aluno.id);
    const btnClass = isSel ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700";
    const btnText = isSel ? "Selecionado" : "Incluir";
    
    tbody.innerHTML += `
      <tr class="border-b">
        <td class="px-6 py-4">${aluno.nome}</td>
        <td class="px-6 py-4">${aluno.grau_atual || "Branca"}</td>
        <td class="px-6 py-4">
          <button id="btn-aluno-${aluno.id}" class="${btnClass} text-white px-3 py-1 rounded text-sm transition" onclick="toggleStudent(${aluno.id})">${btnText}</button>
        </td>
      </tr>`;
  });
  updateCounter();
}

function toggleStudent(id) {
  if (selectedStudents.includes(id)) selectedStudents = selectedStudents.filter(sId => sId !== id);
  else selectedStudents.push(id);
  renderAlunos();
}

function updateCounter() {
    const el = document.getElementById('contador-selecionados');
    if(el) el.textContent = `(${selectedStudents.length})`;
}

// ==================== CRIAR EXAME ====================
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
      method: "POST",
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
  } catch {
    showFeedback("Erro de conexão.", "error");
  }
}

// ==================== BANCA AVALIADORA (POST FIX) ====================
async function abrirBanca(exameId) {
    const modal = document.getElementById('modal-banca');
    const tbody = document.getElementById('tbody-banca');
    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10">Carregando...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/exames/${exameId}/banca`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const inscricoes = await res.json();

        tbody.innerHTML = '';
        if(inscricoes.length === 0) {
             tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-gray-500">Nenhum aluno.</td></tr>';
             return;
        }

        inscricoes.forEach(item => {
            const corMedia = item.media >= 6.0 ? 'text-green-600' : 'text-red-600';
            const statusBadge = item.aprovado 
                ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">APROVADO</span>`
                : `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">REPROVADO</span>`;

            tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-4 py-4 font-medium text-gray-900">${item.aluno_nome}<br><span class="text-xs text-gray-500">${item.aluno_faixa}</span></td>
                
                <td class="p-2"><input type="number" step="0.5" id="k-${item.id}" value="${item.notas.kihon}" class="w-16 border rounded p-1 text-center" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" id="ka-${item.id}" value="${item.notas.kata}" class="w-16 border rounded p-1 text-center" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" id="ku-${item.id}" value="${item.notas.kumite}" class="w-16 border rounded p-1 text-center" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" id="g-${item.id}" value="${item.notas.gerais}" class="w-16 border rounded p-1 text-center" onchange="calcMedia(${item.id})"></td>
                
                <td class="px-4 py-4 text-center font-bold text-lg ${corMedia}" id="m-${item.id}">${item.media}</td>
                <td class="px-4 py-4 text-center" id="s-${item.id}">${statusBadge}</td>
                
                <td class="px-4 py-4 text-center">
                    <button onclick="salvarNota(this, ${item.id})" class="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 shadow">
                       <i data-feather="save" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>`;
        });
        if(typeof feather !== 'undefined') feather.replace();
    } catch {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-red-500">Erro ao abrir banca.</td></tr>';
    }
}

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
        elMedia.className = "px-4 py-4 text-center font-bold text-lg text-green-600";
        elStatus.innerHTML = `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">APROVADO</span>`;
    } else {
        elMedia.className = "px-4 py-4 text-center font-bold text-lg text-red-600";
        elStatus.innerHTML = `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">REPROVADO</span>`;
    }
}

async function salvarNota(btn, inscricaoId) {
    const k = document.getElementById(`k-${inscricaoId}`).value || 0;
    const ka = document.getElementById(`ka-${inscricaoId}`).value || 0;
    const ku = document.getElementById(`ku-${inscricaoId}`).value || 0;
    const g = document.getElementById(`g-${inscricaoId}`).value || 0;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = "..."; 
    btn.disabled = true;

    try {
        // AQUI ESTÁ A CORREÇÃO: Método POST
        const res = await fetch(`${API_BASE}/exames/notas/${inscricaoId}`, {
            method: 'POST', 
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
            body: JSON.stringify({ kihon: k, kata: ka, kumite: ku, gerais: g })
        });

        const result = await res.json();
        
        if(res.ok) {
            calcMedia(inscricaoId); // Garante visual atualizado
            showFeedback("Nota salva!", "success");
        } else {
            alert("Erro: " + result.message);
        }
    } catch {
        alert("Erro de conexão.");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        if(typeof feather !== 'undefined') feather.replace();
    }
}

function fecharBanca() {
    document.getElementById('modal-banca').classList.add('hidden');
}

async function excluirExame(id) {
    if(!confirm("Excluir?")) return;
    try {
        await fetch(`${API_BASE}/exames/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
        loadExames();
    } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  if(getToken()) { loadAlunos(); loadExames(); }
  
  const btnView = document.getElementById("btn-visualizar-selecionados");
  if(btnView) btnView.addEventListener("click", () => {
      document.getElementById('modal-selecionados').classList.remove('hidden');
      const lista = document.getElementById('lista-alunos-selecionados');
      lista.innerHTML = "";
      const sels = allAlunos.filter(a => selectedStudents.includes(a.id));
      if(sels.length === 0) lista.innerHTML = "<li class='text-gray-500'>Vazio</li>";
      sels.forEach(a => lista.innerHTML += `<li class="flex justify-between p-2 border-b"><span>${a.nome}</span></li>`);
  });
});