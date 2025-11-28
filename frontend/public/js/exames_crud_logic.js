// ==================== CONFIGURAÇÃO ====================
const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

// ==================== UTILITÁRIOS ====================
function getToken() { 
    return localStorage.getItem('token'); 
}

function showFeedback(msg, type = 'success') {
    const el = document.getElementById('feedback-message');
    if (!el) return;
    el.textContent = msg;
    el.className = 'feedback-message p-4 rounded-md text-sm mb-4 border ' +
        (type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3500);
}

// ==================== ESTADO GLOBAL ====================
let allAlunos = [];
let selectedStudents = []; // Array de IDs (inteiros)

// ==================== 1. CARREGAR DADOS (ALUNOS E EXAMES) ====================
async function loadAlunos() {
    const tbody = document.getElementById('alunos-tbody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Carregando alunos...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/alunos/`, { 
            headers: { Authorization: `Bearer ${getToken()}` } 
        });
        
        if (!res.ok) throw new Error("Erro ao buscar alunos");
        
        allAlunos = await res.json();
        renderAlunos(); // Desenha a tabela
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 py-4">Erro ao carregar lista de alunos.</td></tr>`;
    }
}

async function loadExames() {
    const tbody = document.getElementById('exames-tbody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Carregando exames...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/exames/`, { 
            headers: { Authorization: `Bearer ${getToken()}` } 
        });
        const exames = await res.json();
        
        tbody.innerHTML = "";
        if(exames.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum exame agendado.</td></tr>`;
            return;
        }

        exames.forEach(exame => {
            const dataF = new Date(exame.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 border-b transition">
                    <td class="px-6 py-4 font-medium text-gray-900">${exame.nome_evento}</td>
                    <td class="px-6 py-4 text-gray-600">${dataF} às ${exame.hora}</td>
                    <td class="px-6 py-4 text-gray-600">
                        <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">
                            ${exame.qtd_alunos || 0} inscritos
                        </span>
                    </td>
                    <td class="px-6 py-4 flex gap-2">
                        <button onclick="abrirBanca(${exame.id})" class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 flex items-center gap-1 transition shadow-sm">
                            <i data-feather="award" class="w-4 h-4"></i> Banca
                        </button>
                        <button onclick="excluirExame(${exame.id})" class="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-50 flex items-center gap-1 transition">
                            <i data-feather="trash-2" class="w-4 h-4"></i> Excluir
                        </button>
                    </td>
                </tr>
            `;
        });
        if(typeof feather !== 'undefined') feather.replace();

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar exames.</td></tr>`;
    }
}

// ==================== 2. SELEÇÃO DE ALUNOS (LÓGICA) ====================
function renderAlunos() {
    const tbody = document.getElementById('alunos-tbody');
    tbody.innerHTML = "";

    if (allAlunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Nenhum aluno cadastrado.</td></tr>`;
        return;
    }

    allAlunos.forEach(aluno => {
        const isSelected = selectedStudents.includes(aluno.id);
        const btnClass = isSelected 
            ? "bg-green-600 hover:bg-green-700 text-white border-transparent" 
            : "bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50";
        
        const btnText = isSelected 
            ? `<span class="flex items-center gap-1"><i data-feather="check" class="w-3 h-3"></i> Selecionado</span>` 
            : "Selecionar";

        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900">${aluno.nome}</td>
            <td class="px-6 py-4 text-gray-600">${aluno.grau_atual || "Branca"}</td>
            <td class="px-6 py-4">
                <button id="btn-aluno-${aluno.id}" class="${btnClass} border px-3 py-1 rounded text-sm font-medium transition duration-200" 
                    onclick="toggleStudent(${aluno.id})">
                    ${btnText}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateCounter();
    if(typeof feather !== 'undefined') feather.replace();
}

function toggleStudent(idStr) {
    const id = parseInt(idStr, 10); // Garante que é número
    
    if (selectedStudents.includes(id)) {
        selectedStudents = selectedStudents.filter(sId => sId !== id);
    } else {
        selectedStudents.push(id);
    }
    console.log("Alunos selecionados:", selectedStudents);
    renderAlunos();
}

function updateCounter() {
    const el = document.getElementById('contador-selecionados');
    if(el) el.textContent = `(${selectedStudents.length})`;
}

// ==================== 3. CRIAR EXAME (FUNÇÃO PRINCIPAL) ====================
// Esta função é chamada direto pelo onclick do HTML
async function createExame() {
    console.log("Iniciando criação de exame...");

    const nome = document.getElementById('exame_nome').value.trim();
    const data = document.getElementById('exame_data').value;
    const hora = document.getElementById('exame_hora').value;
    const local = document.getElementById('exame_local').value.trim();

    // 1. Validação
    if (!nome || !data || !hora || !local) {
        alert("Por favor, preencha todos os campos do exame.");
        return;
    }
    
    if (selectedStudents.length === 0) {
        alert("Selecione pelo menos um aluno na lista para participar do exame.");
        return;
    }

    // 2. Prepara Payload
    const payload = { 
        nome_evento: nome, 
        data: data, 
        hora: hora, 
        local: local, 
        alunos_ids: selectedStudents 
    };

    // 3. Feedback Visual
    const btn = document.getElementById("btn-salvar-exame");
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "Criando...";
    btn.disabled = true;

    try {
        // 4. Envia Requisição (POST)
        const res = await fetch(`${API_BASE}/exames/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${getToken()}` 
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (res.ok) {
            showFeedback("Exame criado com sucesso!", "success");
            
            // Resetar formulário
            selectedStudents = [];
            document.getElementById('form-exame').reset();
            renderAlunos();
            loadExames(); // Atualiza a lista lá embaixo
        } else {
            console.error(json);
            alert(`Erro ao criar: ${json.message}`);
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão. Verifique sua internet ou se o servidor está ativo.");
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        if(typeof feather !== 'undefined') feather.replace();
    }
}

// ==================== 4. BANCA AVALIADORA (NOTAS) ====================
async function abrirBanca(exameId) {
    const modal = document.getElementById('modal-banca');
    const tbody = document.getElementById('tbody-banca');
    
    modal.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-gray-500">Carregando alunos inscritos...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/exames/${exameId}/banca`, { 
            headers: { Authorization: `Bearer ${getToken()}` } 
        });
        const inscricoes = await res.json();

        tbody.innerHTML = '';
        if(inscricoes.length === 0) {
             tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-gray-500">Nenhum aluno inscrito neste exame.</td></tr>';
             return;
        }

        inscricoes.forEach(item => {
            const corMedia = item.media >= 6.0 ? 'text-green-600' : 'text-red-600';
            const statusBadge = item.aprovado 
                ? `<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">APROVADO</span>`
                : `<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">REPROVADO</span>`;

            tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-gray-50 transition">
                <td class="px-4 py-4 font-medium text-gray-900">
                    ${item.aluno_nome}<br>
                    <span class="text-xs text-indigo-500 font-bold uppercase">${item.aluno_faixa || '-'}</span>
                </td>
                
                <td class="p-2"><input type="number" step="0.5" min="0" max="10" id="k-${item.id}" value="${item.notas.kihon}" class="w-16 border border-gray-300 rounded p-1.5 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" min="0" max="10" id="ka-${item.id}" value="${item.notas.kata}" class="w-16 border border-gray-300 rounded p-1.5 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" min="0" max="10" id="ku-${item.id}" value="${item.notas.kumite}" class="w-16 border border-gray-300 rounded p-1.5 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" onchange="calcMedia(${item.id})"></td>
                <td class="p-2"><input type="number" step="0.5" min="0" max="10" id="g-${item.id}" value="${item.notas.gerais}" class="w-16 border border-gray-300 rounded p-1.5 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" onchange="calcMedia(${item.id})"></td>
                
                <td class="px-4 py-4 text-center font-bold text-lg ${corMedia}" id="m-${item.id}">${item.media}</td>
                <td class="px-4 py-4 text-center" id="s-${item.id}">${statusBadge}</td>
                
                <td class="px-4 py-4 text-center">
                    <button onclick="salvarNota(this, ${item.id})" class="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-sm transition active:scale-95" title="Salvar Nota">
                       <i data-feather="save" class="w-5 h-5"></i>
                    </button>
                </td>
            </tr>`;
        });
        if(typeof feather !== 'undefined') feather.replace();
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-red-500 py-4">Erro ao abrir banca. Tente recarregar.</td></tr>';
    }
}

// Cálculo visual imediato (UX)
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
        elStatus.innerHTML = `<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">APROVADO</span>`;
    } else {
        elMedia.className = "px-4 py-4 text-center font-bold text-lg text-red-600";
        elStatus.innerHTML = `<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">REPROVADO</span>`;
    }
}

// Salvar Nota Individual (POST)
async function salvarNota(btn, inscricaoId) {
    // 1. Pega valores dos inputs
    const k = document.getElementById(`k-${inscricaoId}`).value || 0;
    const ka = document.getElementById(`ka-${inscricaoId}`).value || 0;
    const ku = document.getElementById(`ku-${inscricaoId}`).value || 0;
    const g = document.getElementById(`g-${inscricaoId}`).value || 0;

    // 2. Feedback Visual no Botão
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i data-feather="loader" class="w-5 h-5 animate-spin"></i>`;
    if(typeof feather !== 'undefined') feather.replace();
    btn.disabled = true;

    try {
        // 3. Envia POST (Evita erro 405 de PUT/PATCH)
        const res = await fetch(`${API_BASE}/exames/notas/${inscricaoId}`, {
            method: 'POST', 
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${getToken()}` 
            },
            body: JSON.stringify({ kihon: k, kata: ka, kumite: ku, gerais: g })
        });

        const result = await res.json();
        
        if(res.ok) {
            calcMedia(inscricaoId); // Garante que o visual bate com o salvo
            // Mostra toast discreto
            showFeedback(`Nota de ${result.media} salva com sucesso!`);
        } else {
            alert(`Erro ao salvar: ${result.message}`);
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão. Verifique a internet.");
    } finally {
        btn.innerHTML = originalHTML; // Restaura ícone
        btn.disabled = false;
        if(typeof feather !== 'undefined') feather.replace();
    }
}

function fecharBanca() {
    document.getElementById('modal-banca').classList.add('hidden');
}

// ==================== EXCLUIR EXAME ====================
async function excluirExame(id) {
    if(!confirm("Tem certeza que deseja excluir este exame? Todos os registros de notas dele serão apagados.")) return;
    try {
        const res = await fetch(`${API_BASE}/exames/${id}`, { 
            method: 'DELETE', 
            headers: { Authorization: `Bearer ${getToken()}` } 
        });
        
        if(res.ok) {
            showFeedback("Exame excluído.");
            loadExames();
        } else {
            alert("Erro ao excluir.");
        }
    } catch {
        alert("Erro de conexão.");
    }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Verifica Login
    if(!getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Carrega Dados
    loadAlunos();
    loadExames();
  
    // 3. Configura Modal de Visualização de Selecionados
    const btnView = document.getElementById("btn-visualizar-selecionados");
    if(btnView) {
        btnView.addEventListener("click", () => {
            const modal = document.getElementById('modal-selecionados');
            const lista = document.getElementById('lista-alunos-selecionados');
            lista.innerHTML = "";
            
            const sels = allAlunos.filter(a => selectedStudents.includes(a.id));
            
            if(sels.length === 0) {
                lista.innerHTML = "<li class='text-gray-500 text-center py-4'>Nenhum aluno selecionado.</li>";
            } else {
                sels.forEach(a => {
                    lista.innerHTML += `
                        <li class="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                            <span class="font-medium text-gray-700">${a.nome}</span> 
                            <button onclick="toggleStudent('${a.id}'); document.getElementById('btn-visualizar-selecionados').click()" class="text-red-500 hover:bg-red-100 p-1 rounded transition">
                                <i data-feather="x" class="w-4 h-4"></i>
                            </button>
                        </li>`;
                });
            }
            if(typeof feather !== 'undefined') feather.replace();
            modal.classList.remove('hidden');
        });
    }
});