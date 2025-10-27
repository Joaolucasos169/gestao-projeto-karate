// Define a URL base da API (Onde o Flask está rodando)
const API_BASE_URL = 'http://127.0.0.1:5000/api/v1/users';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Função genérica para exibir mensagens
function displayMessage(message, isError) {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) {
        console.error("Elemento 'error-message' não encontrado no DOM.");
        return;
    }
    
    errorMessage.textContent = message;
    if (isError) {
        errorMessage.classList.remove('hidden', 'bg-green-100', 'border-green-400', 'text-green-700');
        errorMessage.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
    } else {
        errorMessage.classList.remove('hidden', 'bg-red-100', 'border-red-400', 'text-red-700');
        errorMessage.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
    }
    errorMessage.classList.remove('hidden');
}


/**
 * Lida com o envio do formulário de Login.
 */
async function handleLogin(event) {
    event.preventDefault(); 
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html'; 
        } else {
            displayMessage(data.message || 'Credenciais inválidas.', true);
        }
    } catch (error) {
        console.error('Erro de rede no login:', error);
        displayMessage('Erro de conexão com o servidor. Tente novamente.', true);
    }
}

/**
 * Lida com o envio do formulário de Cadastro.
 */
async function handleRegister(event) {
    event.preventDefault(); 

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

        if (response.status === 201) {
            alert('Cadastro realizado com sucesso! Faça o login.');
            window.location.href = 'index.html'; 
        } else {
            displayMessage(data.message || 'Erro ao cadastrar.', true);
        }
    } catch (error) {
        console.error('Erro de rede no cadastro:', error);
        displayMessage('Erro de conexão com o servidor. Tente novamente.', true);
    }
}

