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
let dadosBancaAtual = [];

// ==================== LOADERS ====================
async function loadAlunos() {
    const tbody = document.getElementById('alunos-tbody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Carregando alunos...</td></tr>`;
    try {
        const res = await fetch(`${API_BASE}/alunos/`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) throw new Error();
        allAlunos = await res.json();
        renderAlunos();
    } catch {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500">Erro ao carregar lista.</td></tr>`;
    }
}

async function loadExames() {
    const tbody = document.getElementById('exames-tbody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Carregando exames...</td></tr>`;
    try {
        const res = await fetch(`${API_BASE}/exames/`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const exames = await res.json();
        tbody.innerHTML = "";
        
        if(exames.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum exame agendado.</td></tr>`;
            return;
        }

        exames.forEach(ex => {
            const dataF = new Date(ex.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="px-6 py-4 font-medium">${ex.nome_evento}</td>
                    <td class="px-6 py-4 text-gray-600">${dataF} - ${ex.hora}</td>
                    <td class="px-6 py-4 text-gray-600"><span class="bg-gray-100 px-2 py-1 rounded text-xs font-bold">${ex.qtd_alunos} inscritos</span></td>
                    <td class="px-6 py-4 flex gap-2">
                        <button onclick="abrirBanca(${ex.id})" class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition">
                           <i data-feather="award" class="w-4 h-4"></i> Banca
                        </button>
                        <button onclick="window.excluirExame(${ex.id})" class="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 px-2 border border-red-200 rounded hover:bg-red-50 transition">
                           <i data-feather="trash-2" class="w-4 h-4"></i> Excluir
                        </button>
                    </td>
                </tr>`;
        });
        if(typeof feather !== 'undefined') feather.replace();
    } catch {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar exames.</td></tr>`;
    }
}

// ==================== SELEÇÃO DE ALUNOS ====================
function renderAlunos() {
    const tbody = document.getElementById('alunos-tbody');
    tbody.innerHTML = "";
    allAlunos.forEach(aluno => {
        const isSel = selectedStudents.includes(aluno.id);
        const btnClass = isSel ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50";
        const btnText = isSel ? "Selecionado" : "Incluir";
        
        tbody.innerHTML += `
            <tr class="border-b">
                <td class="px-6 py-4 font-medium">${aluno.nome}</td>
                <td class="px-6 py-4 text-gray-500">${aluno.grau_atual || "Branca"}</td>
                <td class="px-6 py-4">
                    <button class="${btnClass} px-3 py-1 rounded text-xs transition" onclick="toggleStudent(${aluno.id})">${btnText}</button>
                </td>
            </tr>`;
    });
    const el = document.getElementById('contador-selecionados');
    if(el) el.textContent = `(${selectedStudents.length})`;
}

function toggleStudent(idStr) {
    const id = parseInt(idStr, 10);
    if (selectedStudents.includes(id)) selectedStudents = selectedStudents.filter(s => s !== id);
    else selectedStudents.push(id);
    renderAlunos();
}

// ==================== EXCLUIR EXAME (GLOBAL) ====================
// Adicionei ao window para garantir visibilidade global
window.excluirExame = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este exame? Todos os registros de notas serão apagados permanentemente.")) return;
    
    try {
        const res = await fetch(`${API_BASE}/exames/${id}`, { 
            method: 'DELETE', 
            headers: { Authorization: `Bearer ${getToken()}` } 
        });
        
        if(res.ok) {
            showFeedback("Exame excluído com sucesso.");
            loadExames(); // Recarrega a lista
        } else {
            const json = await res.json();
            alert("Erro ao excluir: " + (json.message || "Erro desconhecido"));
        }
    } catch {
        alert("Erro de conexão ao tentar excluir.");
    }
};

// ==================== CRIAR EXAME ====================
async function createExame() {
    const nome = document.getElementById('exame_nome').value;
    const data = document.getElementById('exame_data').value;
    const hora = document.getElementById('exame_hora').value;
    const local = document.getElementById('exame_local').value;

    if (!nome || !data || !hora || !local) return alert("Preencha todos os campos!");
    if (selectedStudents.length === 0) return alert("Selecione alunos!");

    const btn = document.getElementById("btn-salvar-exame");
    const txt = btn.innerHTML;
    btn.innerHTML = "Criando..."; btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/exames/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ nome_evento: nome, data, hora, local, alunos_ids: selectedStudents })
        });

        if (res.ok) {
            showFeedback("Exame criado!");
            selectedStudents = [];
            document.getElementById('form-exame').reset();
            renderAlunos();
            loadExames();
        } else {
            const err = await res.json();
            alert("Erro: " + err.message);
        }
    } catch { alert("Erro de conexão."); }
    finally { btn.innerHTML = txt; btn.disabled = false; }
}

// ==================== BANCA AVALIADORA ====================
async function abrirBanca(exameId) {
    document.getElementById('modal-banca').classList.remove('hidden');
    const tbody = document.getElementById('tbody-banca');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-gray-500">Carregando...</td></tr>';
    document.getElementById('lista-ranking').innerHTML = '<li class="text-center text-gray-400 text-sm">Carregando...</li>';

    try {
        const res = await fetch(`${API_BASE}/exames/${exameId}/banca`, { headers: { Authorization: `Bearer ${getToken()}` } });
        dadosBancaAtual = await res.json();
        renderizarTabelaNotas();
        renderizarRanking();
    } catch {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-red-500">Erro ao carregar banca.</td></tr>';
    }
}

function renderizarTabelaNotas() {
    const tbody = document.getElementById('tbody-banca');
    tbody.innerHTML = '';
    
    if(dadosBancaAtual.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-gray-500">Nenhum aluno.</td></tr>';
        return;
    }

    dadosBancaAtual.forEach(item => {
        tbody.innerHTML += `
        <tr class="bg-white border-b hover:bg-gray-50 transition">
            <td class="py-3 px-3">
                <div class="font-medium text-gray-900">${item.aluno_nome}</div>
                <div class="text-[10px] text-gray-500 uppercase">${item.aluno_faixa}</div>
            </td>
            <td class="p-1"><input type="number" step="0.5" min="0" max="10" id="k-${item.id}" value="${item.notas.kihon}" class="w-full border rounded p-1 text-center focus:ring-1 focus:ring-indigo-500"></td>
            <td class="p-1"><input type="number" step="0.5" min="0" max="10" id="ka-${item.id}" value="${item.notas.kata}" class="w-full border rounded p-1 text-center focus:ring-1 focus:ring-indigo-500"></td>
            <td class="p-1"><input type="number" step="0.5" min="0" max="10" id="ku-${item.id}" value="${item.notas.kumite}" class="w-full border rounded p-1 text-center focus:ring-1 focus:ring-indigo-500"></td>
            <td class="p-1"><input type="number" step="0.5" min="0" max="10" id="g-${item.id}" value="${item.notas.gerais}" class="w-full border rounded p-1 text-center focus:ring-1 focus:ring-indigo-500"></td>
            <td class="p-1 text-center">
                <button onclick="salvarNota(this, ${item.id})" class="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-sm transition active:scale-95">
                   <i data-feather="save" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>`;
    });
    if(typeof feather !== 'undefined') feather.replace();
}

function renderizarRanking() {
    const lista = document.getElementById('lista-ranking');
    lista.innerHTML = "";
    const classificados = [...dadosBancaAtual].sort((a, b) => b.media - a.media);

    classificados.forEach((item, index) => {
        const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span class="text-gray-400 font-bold text-sm">#${index+1}</span>`;
        const corStatus = item.aprovado ? 'text-green-600' : 'text-red-500';
        const textoStatus = item.aprovado ? 'APROVADO' : 'REPROVADO';
        const bgRow = item.aprovado ? 'bg-green-50' : 'bg-red-50';

        lista.innerHTML += `
            <li class="border-b last:border-0 p-3 rounded-lg ${bgRow} mb-2 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="text-xl">${medalha}</div>
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${item.aluno_nome}</div>
                        <div class="text-[10px] font-bold ${corStatus}">${textoStatus}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-black text-gray-700">${item.media.toFixed(1)}</div>
                </div>
            </li>
        `;
    });
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
        const res = await fetch(`${API_BASE}/exames/notas/${inscricaoId}`, {
            method: 'POST', 
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ kihon: k, kata: ka, kumite: ku, gerais: g })
        });

        const result = await res.json();
        
        if(res.ok) {
            const idx = dadosBancaAtual.findIndex(i => i.id === inscricaoId);
            if(idx !== -1) {
                dadosBancaAtual[idx].notas = { kihon: k, kata: ka, kumite: ku, gerais: g };
                dadosBancaAtual[idx].media = result.media;
                dadosBancaAtual[idx].aprovado = result.aprovado;
            }
            renderizarRanking();
            showFeedback("Nota Salva!", "success");
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

// ==================== NOVAS FUNÇÕES (MAXIMIZAR E FILTRO) ====================

// 1. Função de Maximizar Tela
let isMaximized = false;
function toggleMaximizar() {
    const modalContainer = document.getElementById('banca-container');
    const modalWrapper = document.getElementById('modal-banca'); // O fundo preto
    const btnIcon = document.getElementById('btn-maximize').querySelector('i'); // O ícone

    if (!isMaximized) {
        // Entrar em Tela Cheia
        modalWrapper.classList.remove('p-2', 'md:p-6'); // Remove padding do fundo
        modalWrapper.classList.add('p-0'); // Cola nas bordas
        
        modalContainer.classList.remove('max-w-7xl', 'md:h-[90vh]', 'rounded-lg'); // Remove limites
        modalContainer.classList.add('w-screen', 'h-screen', 'rounded-none'); // Força 100%
        
        // Troca ícone para "Minimizar"
        btnIcon.setAttribute('data-feather', 'minimize');
        isMaximized = true;
    } else {
        // Voltar ao Normal
        modalWrapper.classList.add('p-2', 'md:p-6');
        modalWrapper.classList.remove('p-0');
        
        modalContainer.classList.add('max-w-7xl', 'md:h-[90vh]', 'rounded-lg');
        modalContainer.classList.remove('w-screen', 'h-screen', 'rounded-none');
        
        // Troca ícone para "Maximizar"
        btnIcon.setAttribute('data-feather', 'maximize');
        isMaximized = false;
    }
    feather.replace(); // Atualiza o ícone
}

// 2. Função de Aplicar Filtro
function aplicarFiltroBanca() {
    const filtro = document.getElementById('filtro-banca').value;

    if (filtro === 'nome') {
        dadosBancaAtual.sort((a, b) => a.aluno_nome.localeCompare(b.aluno_nome));
    } else if (filtro === 'faixa') {
        // Ordena por faixa (alfabética simples, ou você pode criar uma ordem de hierarquia se quiser)
        dadosBancaAtual.sort((a, b) => (a.aluno_faixa || '').localeCompare(b.aluno_faixa || ''));
    } else if (filtro === 'media_desc') {
        dadosBancaAtual.sort((a, b) => b.media - a.media); // Maior nota primeiro
    } else if (filtro === 'media_asc') {
        dadosBancaAtual.sort((a, b) => a.media - b.media); // Menor nota primeiro
    }

    // Redesenha a tabela com a nova ordem
    renderizarTabelaNotas();
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    if(getToken()) { loadAlunos(); loadExames(); }
    
    const btnView = document.getElementById("btn-visualizar-selecionados");
    if(btnView) {
        btnView.addEventListener("click", () => {
            const modal = document.getElementById('modal-selecionados');
            const lista = document.getElementById('lista-alunos-selecionados');
            lista.innerHTML = "";
            const sels = allAlunos.filter(a => selectedStudents.includes(a.id));
            if(sels.length === 0) lista.innerHTML = "<li class='text-gray-500 p-2'>Vazio</li>";
            else sels.forEach(a => lista.innerHTML += `<li class="flex justify-between p-2 border-b"><span>${a.nome}</span></li>`);
            modal.classList.remove('hidden');
        });
    }
});