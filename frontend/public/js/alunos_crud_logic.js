// Define a URL base da API (Backend na porta 5000)
const API_ALUNOS_URL = 'https://gestao-karate-backend.onrender.com/api/v1/alunos/';

// Variáveis globais
let currentEditingAlunoId = null;
let allAlunos = []; // Guarda todos os alunos para busca no frontend
let searchTimeout = null; // Para debounce da busca

document.addEventListener('DOMContentLoaded', () => {
    const token = checkLoginStatus();
    if (!token) return;

    loadAlunos();

    // Listeners
    const alunoForm = document.getElementById('aluno-form');
    if (alunoForm) alunoForm.addEventListener('submit', handleAlunoSubmit);

    const editAlunoForm = document.getElementById('edit-aluno-form');
    if (editAlunoForm) editAlunoForm.addEventListener('submit', handleUpdateAluno);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
});

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert("Sessão encerrada.");
    window.location.href = 'index.html';
}

function setTableContent(htmlContent) {
    const tbody = document.getElementById('alunos-tbody');
    if (tbody) tbody.innerHTML = htmlContent;
}

function createStatusRow(message, isError = false) {
    const textColor = isError ? 'text-red-500' : 'text-gray-500';
    return `<tr><td colspan="7" class="text-center py-4 ${textColor}">${message}</td></tr>`;
}

async function loadAlunos() {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }

    setTableContent(createStatusRow("Carregando alunos..."));

    try {
        const response = await fetch(API_ALUNOS_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) { checkLoginStatus(); return; }
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        allAlunos = await response.json();
        displayAlunos();

    } catch (error) {
        console.error('Erro em loadAlunos:', error);
        setTableContent(createStatusRow("Falha ao conectar ao servidor.", true));
    }
}

function displayAlunos(searchTerm = '') {
    const tbody = document.getElementById('alunos-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filteredAlunos = allAlunos.filter(aluno => {
        const nome = (aluno.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cpf = (aluno.cpf || '').replace(/[^\d]/g, "");
        const searchTermNumerico = term.replace(/[^\d]/g, "");
        return nome.includes(term) || (searchTermNumerico && cpf.includes(searchTermNumerico));
    });

    if (filteredAlunos.length === 0) {
        setTableContent(createStatusRow("Nenhum aluno encontrado."));
    } else {
        let tableHTML = '';
        filteredAlunos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        filteredAlunos.forEach(aluno => {
            const dataUltGradFormatada = aluno.data_ultima_graduacao
                ? new Date(aluno.data_ultima_graduacao + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                : '-';
            tableHTML += `
                <tr id="aluno-row-${aluno.id}">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">${aluno.nome || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${aluno.cpf || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${aluno.grau_atual || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${aluno.sexo || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${aluno.telefone || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${dataUltGradFormatada}</td>
                    <td class="px-6 py-4 text-sm font-medium">
                        <button onclick="openEditModal(${aluno.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Editar</button>
                        <button onclick="deleteAluno(${aluno.id})" class="text-red-600 hover:text-red-900">Inativar</button>
                    </td>
                </tr>`;
        });
        setTableContent(tableHTML);
    }
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    const searchTerm = searchInput.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => displayAlunos(searchTerm), 300);
}

// =================== Cadastrar novo aluno ===================
async function handleAlunoSubmit(event) {
    event.preventDefault();
    const token = getToken();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton || submitButton.disabled) return;

    const alunoData = {
        nome: document.getElementById('nome')?.value.trim(),
        cpf: document.getElementById('cpf')?.value.trim(),
        data_nascimento: document.getElementById('data_nascimento')?.value,
        sexo: document.getElementById('sexo')?.value, // 🔹 Novo campo
        telefone: document.getElementById('telefone')?.value.trim(),
        nome_pais: document.getElementById('nome_pais')?.value.trim(),
        endereco: document.getElementById('endereco')?.value.trim(),
        grau_atual: document.getElementById('grau_atual')?.value,
        data_ultima_graduacao: document.getElementById('data_ultima_graduacao')?.value || null
    };

    if (!alunoData.nome || !alunoData.cpf || !alunoData.data_nascimento || !alunoData.sexo) {
        alert("Nome, CPF, Data de Nascimento e Sexo são obrigatórios.");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Aguarde...';
    showFeedback('');

    try {
        const response = await fetch(API_ALUNOS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(alunoData)
        });

        const result = await response.json();
        if (response.status === 201) {
            showFeedback("Aluno cadastrado com sucesso!", false);
            form.reset();
            loadAlunos();
        } else {
            showFeedback(`Erro ao cadastrar: ${result.message}`, true);
            if (response.status === 401) checkLoginStatus();
        }
    } catch (error) {
        showFeedback("Erro ao comunicar com o servidor.", true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Cadastrar Aluno';
    }
}

// =================== Editar aluno ===================
async function openEditModal(alunoId) {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }

    try {
        const response = await fetch(`${API_ALUNOS_URL}${alunoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const aluno = await response.json();

        document.getElementById('edit-aluno-id').value = aluno.id;
        document.getElementById('edit-nome').value = aluno.nome || '';
        document.getElementById('edit-cpf').value = aluno.cpf || '';
        document.getElementById('edit-data_nascimento').value = aluno.data_nascimento || '';
        document.getElementById('edit-sexo').value = aluno.sexo || ''; // 🔹 Novo campo
        document.getElementById('edit-telefone').value = aluno.telefone || '';
        document.getElementById('edit-nome_pais').value = aluno.nome_pais || '';
        document.getElementById('edit-endereco').value = aluno.endereco || '';
        document.getElementById('edit-grau_atual').value = aluno.grau_atual || 'Branca';
        document.getElementById('edit-data_ultima_graduacao').value = aluno.data_ultima_graduacao || '';

        document.getElementById('edit-modal').style.display = 'flex';
        currentEditingAlunoId = alunoId;
    } catch (error) {
        showFeedback("Erro ao carregar dados do aluno.", true);
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none';
    currentEditingAlunoId = null;
}

// =================== Atualizar aluno ===================
async function handleUpdateAluno(event) {
    event.preventDefault();
    const token = getToken();
    if (!token || !currentEditingAlunoId) return;

    const updatedData = {
        nome: document.getElementById('edit-nome')?.value.trim(),
        cpf: document.getElementById('edit-cpf')?.value.trim(),
        data_nascimento: document.getElementById('edit-data_nascimento')?.value,
        sexo: document.getElementById('edit-sexo')?.value, // 🔹 Novo campo
        telefone: document.getElementById('edit-telefone')?.value.trim(),
        nome_pais: document.getElementById('edit-nome_pais')?.value.trim(),
        endereco: document.getElementById('edit-endereco')?.value.trim(),
        grau_atual: document.getElementById('edit-grau_atual')?.value,
        data_ultima_graduacao: document.getElementById('edit-data_ultima_graduacao')?.value || null
    };

    if (!updatedData.nome || !updatedData.cpf || !updatedData.data_nascimento || !updatedData.sexo) {
        alert("Nome, CPF, Data de Nascimento e Sexo são obrigatórios.");
        return;
    }

    try {
        const response = await fetch(`${API_ALUNOS_URL}${currentEditingAlunoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        if (response.ok) {
            showFeedback("Aluno atualizado com sucesso!", false);
            closeEditModal();
            loadAlunos();
        } else {
            showFeedback(`Erro: ${result.message}`, true);
        }
    } catch (error) {
        showFeedback("Erro de conexão.", true);
    }
}

// =================== Excluir aluno ===================
async function deleteAluno(id) {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }

    if (confirm("Tem certeza que deseja marcar o aluno como inativo?")) {
        try {
            const response = await fetch(`${API_ALUNOS_URL}${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                showFeedback("Aluno inativado.", false);
                loadAlunos();
            } else {
                showFeedback(result.message, true);
            }
        } catch {
            showFeedback("Erro ao conectar ao servidor.", true);
        }
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function checkLoginStatus() {
    const token = getToken();
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

function showFeedback(message, isError = true) {
    const feedback = document.getElementById('feedback-message');
    if (!feedback) return alert(message);

    feedback.textContent = message;
    feedback.className =
        `feedback-message p-4 rounded-md text-sm mb-4 ${isError
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-green-100 text-green-800 border border-green-300'}`;
    feedback.style.display = "block";
    setTimeout(() => feedback.style.display = "none", 4000);
}
