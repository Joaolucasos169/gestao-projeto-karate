const API_PROFESSORES_URL = 'https://gestao-karate-backend.onrender.com/api/v1/professores/';

let currentEditingProfId = null;

function showFeedback(message, isError = true) {
    const feedbackElement = document.getElementById('feedback-message');
    if (!feedbackElement) {
        console.error("Elemento 'feedback-message' não encontrado.");
        alert(message);
        return;
    }
    if (!message || message.trim() === '') {
        feedbackElement.style.display = 'none';
        return;
    }
    feedbackElement.textContent = message;
    feedbackElement.className = 'feedback-message p-4 mb-4 rounded-md text-sm'; // Reseta

    // CORREÇÃO: Adiciona classes separadamente
    if (isError) {
        feedbackElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
    } else {
        feedbackElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
    }
    // FIM DA CORREÇÃO

    feedbackElement.style.display = 'block';
    setTimeout(() => {
         if (feedbackElement && feedbackElement.style.display === 'block') feedbackElement.style.display = 'none';
    }, 5000);
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

async function loadProfessores() {
    const token = getToken();
    if (!token) return;

    const tableBody = document.getElementById('professores-table-body');
    if (!tableBody) { console.error("Elemento 'professores-table-body' não encontrado."); return; }

    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Carregando professores...</td></tr>';

    try {
        const response = await fetch(API_PROFESSORES_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) { checkLoginStatus(); return; }
        if (!response.ok) { throw new Error(`Erro HTTP ${response.status}`); }

        const professores = await response.json();
        tableBody.innerHTML = '';

        if (professores.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum professor cadastrado.</td></tr>`;
            return;
        }

        professores.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        professores.forEach(prof => {
            const rowElement = document.createElement('tr');
            rowElement.id = `prof-${prof.id}`;

            const nomeTd = document.createElement('td');
            nomeTd.className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900";
            nomeTd.textContent = prof.nome || '-';
            rowElement.appendChild(nomeTd);

            const cpfTd = document.createElement('td');
            cpfTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";
            cpfTd.textContent = prof.cpf || '-';
            rowElement.appendChild(cpfTd);

            const grauTd = document.createElement('td');
            grauTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";
            grauTd.textContent = prof.grau_faixa || '-';
            rowElement.appendChild(grauTd);

            const telTd = document.createElement('td');
            telTd.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";
            telTd.textContent = prof.telefone || '-';
            rowElement.appendChild(telTd);

            const acoesTd = document.createElement('td');
            acoesTd.className = "px-6 py-4 whitespace-nowrap text-sm font-medium";

            const editButton = document.createElement('button');
            editButton.className = "text-indigo-600 hover:text-indigo-900 mr-3";
            editButton.textContent = '✏️ Editar';
            editButton.onclick = () => openEditProfModal(prof.id);
            acoesTd.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = "text-red-600 hover:text-red-900";
            deleteButton.textContent = '❌ Inativar';
            deleteButton.onclick = () => deleteProfessor(prof.id);
            acoesTd.appendChild(deleteButton);

            rowElement.appendChild(acoesTd);
            tableBody.appendChild(rowElement);
        });

    } catch (error) {
        console.error('Erro ao carregar professores:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Falha ao carregar dados.</td></tr>`;
    }
}


async function handleProfessorSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton || submitButton.disabled) return;

    const data = {
        nome: document.getElementById('nome')?.value.trim(),
        email: document.getElementById('email')?.value.trim(),
        senha: document.getElementById('senha')?.value,
        cpf: document.getElementById('cpf')?.value.trim(),
        data_nascimento: document.getElementById('data_nascimento')?.value,
        telefone: document.getElementById('telefone')?.value.trim(),
        endereco: document.getElementById('endereco')?.value.trim(),
        grau: document.getElementById('grau')?.value.trim()
    };

    if (!data.nome || !data.email || !data.senha || !data.cpf || !data.data_nascimento || !data.telefone || !data.grau) {
        showFeedback("Todos os campos marcados com * são obrigatórios.", true);
        return;
    }
    if (data.senha.length < 6) {
        showFeedback("A senha provisória deve ter pelo menos 6 caracteres.", true);
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
     if (!datePattern.test(data.data_nascimento)) {
         showFeedback("Formato da Data de Nascimento inválido. Use AAAA-MM-DD.", true);
         return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Aguarde...';
    showFeedback('');

    try {
        const response = await fetch(API_PROFESSORES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(err => ({ message: `Erro ${response.status}: ${response.statusText}` }));


        if (response.status === 201) {
            showFeedback("Professor cadastrado com sucesso!", false);
            form.reset();
            loadProfessores();
        } else {
            showFeedback(result.message || "Erro ao cadastrar.", true);
            if(response.status === 401 || response.status === 403) checkLoginStatus();
        }

    } catch (error) {
        console.error('Erro de rede ao enviar formulário:', error);
        showFeedback("Falha de conexão com o servidor.", true);
    } finally {
         if (submitButton) {
             submitButton.disabled = false;
             submitButton.textContent = 'Cadastrar Professor';
         }
    }
}

async function openEditProfModal(profId) {
    const token = getToken();
    if (!token) { checkLoginStatus(); return; }
    showFeedback('');

    try {
        const response = await fetch(`${API_PROFESSORES_URL}${profId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) { checkLoginStatus(); return; }
        if (!response.ok) { throw new Error(`Erro ${response.status}`); }

        const professor = await response.json();

        document.getElementById('edit-prof-id').value = professor.id;
        document.getElementById('edit-prof-nome').value = professor.nome || '';
        document.getElementById('edit-prof-cpf').value = professor.cpf || '';
        document.getElementById('edit-prof-data_nascimento').value = professor.data_nascimento || '';
        document.getElementById('edit-prof-telefone').value = professor.telefone || '';
        document.getElementById('edit-prof-endereco').value = professor.endereco || '';
        document.getElementById('edit-prof-grau').value = professor.grau_faixa || '';

        const modal = document.getElementById('edit-prof-modal');
        if (modal) modal.style.display = 'flex';
        else console.error("Elemento 'edit-prof-modal' não encontrado.");

        currentEditingProfId = profId;

    } catch (error) {
        console.error(`Erro ao carregar dados do professor ${profId}:`, error);
        showFeedback("Não foi possível carregar dados para edição.", true);
    }
}

function closeEditProfModal() {
    const modal = document.getElementById('edit-prof-modal');
    const form = document.getElementById('edit-professor-form');
    if (modal) modal.style.display = 'none';
    currentEditingProfId = null;
    if (form) form.reset();
}

async function handleUpdateProfessor(event) {
    event.preventDefault();
    const token = getToken();
    if (!token || !currentEditingProfId) return;

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton || submitButton.disabled) return;

    const updatedData = {
        nome: document.getElementById('edit-prof-nome')?.value.trim(),
        cpf: document.getElementById('edit-prof-cpf')?.value.trim(),
        data_nascimento: document.getElementById('edit-prof-data_nascimento')?.value,
        telefone: document.getElementById('edit-prof-telefone')?.value.trim(),
        endereco: document.getElementById('edit-prof-endereco')?.value.trim(),
        grau: document.getElementById('edit-prof-grau')?.value.trim()
    };

    if (!updatedData.nome || !updatedData.cpf || !updatedData.data_nascimento || !updatedData.telefone || !updatedData.grau) {
        alert("Nome, CPF, Data de Nascimento, Telefone e Grau são obrigatórios.");
        return;
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
     if (!datePattern.test(updatedData.data_nascimento)) {
         alert("Formato da Data de Nascimento inválido.");
         return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
        const response = await fetch(`${API_PROFESSORES_URL}${currentEditingProfId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json().catch(err => ({ message: `Erro ${response.status}: ${response.statusText}` }));

        if (response.ok) {
            showFeedback("Professor atualizado com sucesso!", false);
            closeEditProfModal();
            loadProfessores();
        } else {
             showFeedback(`Erro ao atualizar: ${result.message || 'Verifique os dados.'}`, true);
             if (response.status === 401 || response.status === 403) checkLoginStatus();
             if (response.status !== 400 && response.status !== 409) closeEditProfModal();
        }

    } catch (error) {
        console.error('Erro de rede ao atualizar professor:', error);
         showFeedback("Erro ao comunicar com o servidor.", true);
         closeEditProfModal();
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    }
}


async function deleteProfessor(id) {
    const token = getToken();
    if (!token) return;

    if (confirm(`Tem certeza que deseja marcar o professor ID ${id} como inativo?`)) {
         try {
            const response = await fetch(`${API_PROFESSORES_URL}${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json().catch(err => ({ message: `Erro ${response.status}` }));

            if (response.ok) {
                 showFeedback(result.message || "Professor inativado.", false);
                 loadProfessores();
            } else {
                 showFeedback(result.message || "Erro ao inativar.", true);
                 if(response.status === 401 || response.status === 403) checkLoginStatus();
            }
        } catch (error) {
            showFeedback("Falha de conexão ao inativar.", true);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = checkLoginStatus();
    if (token) {
        loadProfessores();
        const professorForm = document.getElementById('professor-form');
        if (professorForm) {
            // Event listener is already in HTML onsubmit
        }
        const editProfessorForm = document.getElementById('edit-professor-form');
         if (editProfessorForm) {
            // Event listener is already in HTML onsubmit
        }
    }
});

