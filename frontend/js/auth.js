// URL Base da sua API Flask (Localmente: http://127.0.0.1:5000)
// Em Produção: Mudar para a URL pública do seu servidor (Railway/Render)
const API_BASE_URL = 'http://127.0.0.1:5000/api/v1/users'; 
const messageBox = document.getElementById('message-box');

// Função para exibir mensagens (erro ou sucesso)
function displayMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.classList.remove('opacity-0', 'hidden', 'bg-red-500', 'bg-green-500');
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    messageBox.classList.add('opacity-100');
    
    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
        messageBox.classList.remove('opacity-100');
        messageBox.classList.add('opacity-0');
        setTimeout(() => messageBox.classList.add('hidden'), 300);
    }, 5000);
}

// ----------------------------------------------------
// Lógica de Login
// ----------------------------------------------------
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                // Guarda o token e dados do usuário no LocalStorage
                localStorage.setItem('user_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                displayMessage('Login realizado com sucesso! Redirecionando...', false);
                // Redireciona para a página principal (Dashboard, que vamos criar)
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } else {
                displayMessage(data.message || 'Erro ao fazer login.', true);
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            displayMessage('Falha na conexão com o servidor.', true);
        }
    });
}

// ----------------------------------------------------
// Lógica de Cadastro
// ----------------------------------------------------
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage('Cadastro realizado! Faça login agora.', false);
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = 'index.html'; // Volta para o login
                }, 2000);
            } else {
                displayMessage(data.message || 'Erro ao cadastrar usuário.', true);
            }
        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            displayMessage('Falha na conexão com o servidor.', true);
        }
    });
}