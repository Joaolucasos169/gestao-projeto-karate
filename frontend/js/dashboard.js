document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('user_token');
    const userData = localStorage.getItem('user_data');
    
    // Elementos da interface
    const userDisplayElement = document.getElementById('user-display');
    const userNameElement = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');
    const recentUser = document.getElementById('recent-user');

    // 1. Verificação de Autenticação
    if (!token || !userData) {
        // Se não houver token ou dados, o usuário não está logado
        alert("Sessão expirada. Faça login novamente."); // Usamos alert aqui no frontend, pois não estamos em um Iframe
        window.location.href = 'index.html';
        return;
    }

    // 2. Carregar Dados do Usuário
    let user = null;
    try {
        user = JSON.parse(userData);
    } catch (e) {
        console.error("Erro ao analisar dados do usuário:", e);
        handleLogout();
        return;
    }

    // Exibir nome do usuário na interface
    if (user && user.nome) {
        const firstName = user.nome.split(' ')[0];
        userDisplayElement.textContent = `Logado como: ${firstName}`;
        userNameElement.textContent = firstName;
        recentUser.textContent = user.nome;
    }

    // 3. Lógica de Logout
    function handleLogout() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        alert("Sessão encerrada.");
        window.location.href = 'index.html';
    }

    // Evento de clique para o botão de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // 4. Exemplo de uso do token para uma requisição segura (GET /api/v1/alunos)
    async function loadAlunoCount() {
        const API_ALUNOS_URL = 'http://127.0.0.1:5000/api/v1/alunos';
        
        try {
            const response = await fetch(API_ALUNOS_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Envia o token de autenticação no formato "Bearer [token]"
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const alunos = await response.json();
                // Atualiza o card de estatísticas com o número real de alunos
                document.querySelector('.md\\:grid-cols-3 > div:nth-child(1) p:nth-child(2)').textContent = alunos.length;
            } else if (response.status === 401) {
                // Token expirado ou inválido
                displayMessage('Sessão Inválida. Faça login novamente.', true);
                handleLogout();
            } else {
                console.error("Erro ao carregar alunos:", await response.text());
            }

        } catch (error) {
            console.error('Falha na conexão com a API de alunos:', error);
        }
    }

    // loadAlunoCount(); // Descomente para carregar a contagem de alunos reais

});