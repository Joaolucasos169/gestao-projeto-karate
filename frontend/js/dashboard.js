document.addEventListener('DOMContentLoaded', () => {
    // Verifica o login antes de tudo
    const token = localStorage.getItem('token'); // Usa a chave 'token'
    const userData = localStorage.getItem('user'); // Usa a chave 'user'

    // Elementos da interface
    const userNameElement = document.getElementById('user-name');
    const logoutButton = document.getElementById('logoutButton'); // ID CORRIGIDO
    const statsAlunosElement = document.getElementById('stats-total-alunos');
    const statsProfessoresElement = document.getElementById('stats-professores'); // ID para contagem de professores

    // 1. Verificação de Autenticação (Chaves Corrigidas)
    if (!token || !userData) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = 'index.html'; // Relativo à pasta /public/
        return;
    }

    // 2. Carregar Dados do Usuário
    let user = null;
    try {
        user = JSON.parse(userData);
    } catch (e) {
        console.error("Erro ao analisar dados do usuário:", e);
        handleLogout(); // Força logout se os dados estiverem corrompidos
        return;
    }

    // Exibir nome do usuário na interface
    if (user && user.nome && userNameElement) {
        const firstName = user.nome.split(' ')[0];
        userNameElement.textContent = firstName;
    } else if (userNameElement) {
        userNameElement.textContent = "Usuário"; // Fallback
    }

    // 3. Lógica de Logout
    function handleLogout() {
        localStorage.removeItem('token'); // Chave correta
        localStorage.removeItem('user'); // Chave correta
        alert("Sessão encerrada.");
        window.location.href = 'index.html'; // Relativo à pasta /public/
    }

    // Evento de clique para o botão de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // --- FUNÇÕES PARA CARREGAR ESTATÍSTICAS ---

    // Função genérica para buscar dados da API
    async function fetchData(url, token) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) { // Token inválido/expirado
                console.error(`Erro 401: Token inválido ou expirado ao buscar ${url}`);
                handleLogout();
                return null; // Retorna null para indicar falha na autenticação
            }
            if (!response.ok) {
                console.error(`Erro ${response.status} ao buscar dados de ${url}`);
                return []; // Retorna lista vazia em caso de outros erros
            }
            return await response.json(); // Retorna os dados
        } catch (error) {
            console.error(`Falha de rede ao buscar ${url}:`, error);
            return []; // Retorna lista vazia em caso de erro de rede
        }
    }

    // Carrega e exibe contagem de alunos
    async function loadAlunoStats() {
        const API_ALUNOS_URL = 'http://127.0.0.1:5000/api/v1/alunos/'; // URL com barra
        const alunos = await fetchData(API_ALUNOS_URL, token);
        if (statsAlunosElement) {
            if (alunos !== null) { // Verifica se fetch não retornou null (erro 401)
                statsAlunosElement.textContent = alunos ? alunos.length : 'Erro'; // Exibe contagem ou 'Erro'
            } else {
                 statsAlunosElement.textContent = 'Erro'; // Erro de autenticação
            }
        } else {
            console.error("Elemento 'stats-total-alunos' não encontrado.");
        }
    }

    // Carrega e exibe contagem de professores
    async function loadProfessorStats() {
        const API_PROFESSORES_URL = 'http://127.0.0.1:5000/api/v1/professores/'; // URL com barra
        const professores = await fetchData(API_PROFESSORES_URL, token);
        if (statsProfessoresElement) {
            if (professores !== null) { // Verifica se fetch não retornou null
                statsProfessoresElement.textContent = professores ? professores.length : 'Erro'; // Exibe contagem ou 'Erro'
            } else {
                statsProfessoresElement.textContent = 'Erro'; // Erro de autenticação
            }
        } else {
            console.error("Elemento 'stats-professores' não encontrado.");
        }
    }

    // Carrega todas as estatísticas ao iniciar a página
    loadAlunoStats();
    loadProfessorStats();

});

