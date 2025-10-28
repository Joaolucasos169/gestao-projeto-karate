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

    // Listeners (mantidos como antes)
    const alunoForm = document.getElementById('aluno-form');
    if (alunoForm) alunoForm.addEventListener('submit', handleAlunoSubmit);
    else console.error("ERRO: 'aluno-form' não encontrado.");

    const editAlunoForm = document.getElementById('edit-aluno-form');
    if (editAlunoForm) editAlunoForm.addEventListener('submit', handleUpdateAluno);
    else console.error("ERRO: 'edit-aluno-form' não encontrado.");

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    else console.error("ERRO: 'search-input' não encontrado.");

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
    if (tbody) {
        tbody.innerHTML = htmlContent;
    } else {
        console.error("ERRO CRÍTICO: Elemento 'alunos-tbody' não encontrado.");
    }
}

function createStatusRow(message, isError = false) {
    const textColor = isError ? 'text-red-500' : 'text-gray-500';
    return `<tr><td colspan="6" class="text-center py-4 ${textColor}">${message}</td></tr>`;
}

async function loadAlunos() {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }

    const tbody = document.getElementById('alunos-tbody');
    if (!tbody) { console.error("ERRO CRÍTICO em loadAlunos: 'alunos-tbody' não encontrado."); return; }

    setTableContent(createStatusRow("Carregando alunos..."));

    try {
        const response = await fetch(API_ALUNOS_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) { checkLoginStatus(); return; }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        allAlunos = await response.json();
        displayAlunos();

    } catch (error) {
        console.error('Erro em loadAlunos:', error);
        setTableContent(createStatusRow("Falha ao conectar ao servidor.", true));
    }
}

function displayAlunos(searchTerm = '') {
    const tbody = document.getElementById('alunos-tbody');
    if (!tbody) { console.error("ERRO CRÍTICO em displayAlunos: 'alunos-tbody' não encontrado."); return; }

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
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${aluno.nome || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${aluno.cpf || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${aluno.grau_atual || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${aluno.telefone || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataUltGradFormatada}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
    searchTimeout = setTimeout(() => {
        displayAlunos(searchTerm);
    }, 300);
}

async function handleAlunoSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    if (!submitButton || submitButton.disabled) return;
    if (submitButton.disabled) return;

    const alunoData = {
        nome: document.getElementById('nome')?.value.trim(),
        cpf: document.getElementById('cpf')?.value.trim(),
        data_nascimento: document.getElementById('data_nascimento')?.value,
        telefone: document.getElementById('telefone')?.value.trim(),
        nome_pais: document.getElementById('nome_pais')?.value.trim(),
        endereco: document.getElementById('endereco')?.value.trim(),
        grau_atual: document.getElementById('grau_atual')?.value,
        data_ultima_graduacao: document.getElementById('data_ultima_graduacao')?.value || null
    };

    if (!alunoData.nome || !alunoData.cpf || !alunoData.data_nascimento) {
        alert("Nome Completo, CPF e Data de Nascimento são campos obrigatórios.");
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(alunoData.data_nascimento)) {
         alert("Formato da Data de Nascimento inválido. Use AAAA-MM-DD.");
         return;
    }
    if (alunoData.data_ultima_graduacao && !datePattern.test(alunoData.data_ultima_graduacao)) {
        alert("Formato da Data da Última Graduação inválido. Use AAAA-MM-DD.");
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
        const result = await response.json().catch(err => ({ message: `Erro ${response.status}: ${response.statusText}` }));

        if (response.status === 201) {
            showFeedback("Aluno cadastrado com sucesso!", false);
            form.reset();
            loadAlunos();
        } else {
            showFeedback(`Erro ao cadastrar: ${result.message || 'Verifique os dados.'}`, true);
             if (response.status === 401) checkLoginStatus();
        }
    } catch (error) {
        showFeedback("Erro ao comunicar com o servidor durante o cadastro.", true);
    } finally {
        const currentButton = document.querySelector('#aluno-form button[type="submit"]');
        if (currentButton) {
             currentButton.disabled = false;
             currentButton.textContent = 'Cadastrar Aluno';
        }
    }
}

async function openEditModal(alunoId) {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }
    showFeedback('');
    try {
        const response = await fetch(`${API_ALUNOS_URL}${alunoId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) { checkLoginStatus(); return; }
        if (!response.ok) { throw new Error(`Erro HTTP ${response.status}`); }
        const aluno = await response.json();

        const editId = document.getElementById('edit-aluno-id');
        const editNome = document.getElementById('edit-nome');
        const editCpf = document.getElementById('edit-cpf');
        const editNasc = document.getElementById('edit-data_nascimento');
        const editTel = document.getElementById('edit-telefone');
        const editPais = document.getElementById('edit-nome_pais');
        const editEnd = document.getElementById('edit-endereco');
        const editGrau = document.getElementById('edit-grau_atual');
        const editUltGrad = document.getElementById('edit-data_ultima_graduacao');
        const modal = document.getElementById('edit-modal');

        if(editId) editId.value = aluno.id;
        if(editNome) editNome.value = aluno.nome || '';
        if(editCpf) editCpf.value = aluno.cpf || '';
        if(editNasc) editNasc.value = aluno.data_nascimento || '';
        if(editTel) editTel.value = aluno.telefone || '';
        if(editPais) editPais.value = aluno.nome_pais || '';
        if(editEnd) editEnd.value = aluno.endereco || '';
        if(editGrau) editGrau.value = aluno.grau_atual || 'Branca';
        if(editUltGrad) editUltGrad.value = aluno.data_ultima_graduacao || '';

        if(modal) modal.style.display = 'flex'; else console.error("ID 'edit-modal' não encontrado.");
        currentEditingAlunoId = alunoId;

    } catch (error) {
        showFeedback("Não foi possível carregar os dados do aluno para edição.", true);
    }
}


function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-aluno-form');
    if(modal) modal.style.display = 'none';
    currentEditingAlunoId = null;
    if(form) form.reset();
}


async function handleUpdateAluno(event) {
    event.preventDefault();
    const token = getToken();
    if (!token || !currentEditingAlunoId) return;

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton || submitButton.disabled) return;

    const updatedData = {
        nome: document.getElementById('edit-nome')?.value.trim(),
        cpf: document.getElementById('edit-cpf')?.value.trim(),
        data_nascimento: document.getElementById('edit-data_nascimento')?.value,
        telefone: document.getElementById('edit-telefone')?.value.trim(),
        nome_pais: document.getElementById('edit-nome_pais')?.value.trim(),
        endereco: document.getElementById('edit-endereco')?.value.trim(),
        grau_atual: document.getElementById('edit-grau_atual')?.value,
        data_ultima_graduacao: document.getElementById('edit-data_ultima_graduacao')?.value || null
    };

    if (!updatedData.nome || !updatedData.cpf || !updatedData.data_nascimento) {
        alert("Nome, CPF e Data de Nascimento são obrigatórios."); return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(updatedData.data_nascimento)) {
         alert("Formato da Data de Nascimento inválido."); return;
    }
    if (updatedData.data_ultima_graduacao && !datePattern.test(updatedData.data_ultima_graduacao)) {
        alert("Formato da Data da Última Graduação inválido."); return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
        const response = await fetch(`${API_ALUNOS_URL}${currentEditingAlunoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json().catch(err => ({ message: `Erro ${response.status}` }));

        if (response.ok) {
            showFeedback("Aluno atualizado com sucesso!", false);
            closeEditModal();
            loadAlunos();
        } else {
             showFeedback(`Erro ao atualizar: ${result.message}`, true);
             if (response.status === 401) checkLoginStatus();
             // Não fecha o modal em caso de erro 400/409 para permitir correção
             if (response.status !== 400 && response.status !== 409) closeEditModal();
        }
    } catch (error) {
         console.error("Erro de rede ao atualizar:", error);
         showFeedback("Erro ao comunicar com o servidor.", true);
         // Fecha o modal em caso de erro de rede para evitar confusão
         closeEditModal();
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    }
}


async function deleteAluno(id) {
    const token = getToken();
     if (!token) { checkLoginStatus(); return; }

    if (confirm(`Tem certeza que deseja marcar o aluno ID ${id} como inativo?`)) {
         try {
            const response = await fetch(`${API_ALUNOS_URL}${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json().catch(err => ({ message: `Erro ${response.status}` }));

            if (response.ok) {
                 showFeedback(result.message || "Aluno inativado.", false);
                 loadAlunos();
            } else {
                 showFeedback(`Erro ao inativar: ${result.message}`, true);
                 if(response.status === 401) checkLoginStatus();
            }
        } catch (error) {
            showFeedback("Falha de conexão ao inativar.", true);
        }
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function checkLoginStatus() {
    const token = getToken();
    if (!token) {
        alert("Sessão expirada. Faça login.");
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

// *** FUNÇÃO showFeedback CORRIGIDA ***
function showFeedback(message, isError = true) {
    const feedbackElement = document.getElementById('feedback-message');
    if (!feedbackElement) {
        if (message) alert(message); // Fallback
        return;
    }
    if (!message || message.trim() === '') {
        feedbackElement.style.display = 'none';
        return;
    }

    feedbackElement.textContent = message;

    // Reseta classes de cor/borda antes de adicionar as novas
    feedbackElement.classList.remove(
        'bg-red-100', 'border-red-400', 'text-red-700',
        'bg-green-100', 'border-green-400', 'text-green-700'
    );

    // Adiciona as classes corretas UMA DE CADA VEZ ou usando spread operator
    if (isError) {
        feedbackElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        // Alternativa com spread:
        // const errorClasses = ['bg-red-100', 'border-red-400', 'text-red-700'];
        // feedbackElement.classList.add(...errorClasses);
    } else {
        feedbackElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
        // Alternativa com spread:
        // const successClasses = ['bg-green-100', 'border-green-400', 'text-green-700'];
        // feedbackElement.classList.add(...successClasses);
    }

    feedbackElement.style.display = 'block';

    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
        if (feedbackElement && feedbackElement.style.display === 'block') {
             feedbackElement.style.display = 'none';
        }
    }, 5000);
}


