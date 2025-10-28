const API_BASE_URL = 'http://127.0.0.1:5000/api/v1/users';

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const icon = element.querySelector('i');
    if (!icon) return;

    if (isValid) {
        element.classList.remove('invalid');
        element.classList.add('valid');
        icon.setAttribute('data-feather', 'check-circle');
    } else {
        element.classList.remove('valid');
        element.classList.add('invalid');
        icon.setAttribute('data-feather', 'x-circle');
    }
}

function checkPasswordStrength() {
    const senha = document.getElementById('senha')?.value || '';
    let isStrong = true;

    const checks = {
        length: senha.length >= 8,
        lowercase: /[a-z]/.test(senha),
        uppercase: /[A-Z]/.test(senha),
        number: /[0-9]/.test(senha),
        special: /[!@#$%^&*]/.test(senha)
    };

    for (const [key, isValid] of Object.entries(checks)) {
        updateRequirement(key, isValid);
        if (!isValid) isStrong = false;
    }
    
    feather.replace(); // CORREÇÃO: Movido para fora do loop
    updateRegisterButtonState();
    return isStrong;
}

function checkPasswordMatch() {
    const senha = document.getElementById('senha')?.value;
    const confirmarSenha = document.getElementById('confirmarSenha')?.value;
    const feedback = document.getElementById('confirmar-senha-feedback');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    if (!feedback || !confirmarSenhaInput) return false;

    const isMatch = (senha === confirmarSenha) && (confirmarSenha.length > 0);

    if (confirmarSenha.length > 0 && !isMatch) {
        feedback.classList.remove('hidden');
        confirmarSenhaInput.classList.add('border-red-500');
        confirmarSenhaInput.classList.remove('border-gray-300');
    } else {
        feedback.classList.add('hidden');
        confirmarSenhaInput.classList.remove('border-red-500');
        confirmarSenhaInput.classList.add('border-gray-300');
    }
    updateRegisterButtonState();
    return isMatch || !confirmarSenha.length;
}

function checkEmailDomain() {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('email-feedback');
    if (!emailInput || !emailFeedback) return false;

    const email = emailInput.value.toLowerCase();
    const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
    const isValid = email ? validDomains.some(domain => email.endsWith(domain)) : false;

    if (email && !isValid) {
        emailFeedback.classList.remove('hidden');
        emailInput.classList.add('border-red-500');
        emailInput.classList.remove('border-gray-300');
    } else {
        emailFeedback.classList.add('hidden');
        emailInput.classList.remove('border-red-500');
        emailInput.classList.add('border-gray-300');
    }
    updateRegisterButtonState();
    return isValid;
}

function updateRegisterButtonState() {
    const registerButton = document.getElementById('registerButton');
    if (!registerButton) return;

    const nome = document.getElementById('nome')?.value.trim();
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    if (!nome || !emailInput || !senhaInput || !confirmarSenhaInput) {
        registerButton.disabled = true;
        return;
    }

    const email = emailInput.value.toLowerCase();
    const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
    const isEmailValid = validDomains.some(domain => email.endsWith(domain));

    const senha = senhaInput.value;
    const isStrong = (
        senha.length >= 8 &&
        /[a-z]/.test(senha) &&
        /[A-Z]/.test(senha) &&
        /[0-9]/.test(senha) &&
        /[!@#$%^&*]/.test(senha)
    );
    const doPasswordsMatch = (senha === confirmarSenhaInput.value);

    registerButton.disabled = !(nome && isEmailValid && isStrong && doPasswordsMatch);
}

function togglePasswordVisibility(fieldId, iconId) {
    const field = document.getElementById(fieldId);
    const iconElement = document.getElementById(iconId);
    if (field && iconElement) {
        if (field.type === "password") {
            field.type = "text";
            iconElement.setAttribute('data-feather', 'eye');
        } else {
            field.type = "password";
            iconElement.setAttribute('data-feather', 'eye-off');
        }
        feather.replace();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        const nomeInput = document.getElementById('nome');
        const emailInput = document.getElementById('email');
        const senhaInput = document.getElementById('senha');
        const confirmarSenhaInput = document.getElementById('confirmarSenha');

        if (nomeInput) nomeInput.addEventListener('input', updateRegisterButtonState);
        if (emailInput) emailInput.addEventListener('input', checkEmailDomain);
        if (senhaInput) {
            senhaInput.addEventListener('input', () => {
                checkPasswordStrength();
                checkPasswordMatch();
            });
        }
        if (confirmarSenhaInput) confirmarSenhaInput.addEventListener('input', checkPasswordMatch);

        checkEmailDomain();
        checkPasswordStrength();
        checkPasswordMatch();
    }
});

function displayMessage(message, isError, formType = 'login') {
    const elementId = formType === 'register' ? 'feedback-message' : 'error-message';
    const messageElement = document.getElementById(elementId);
    if (!messageElement) {
        alert(message);
        return;
    }
    
    messageElement.textContent = message;
    messageElement.classList.remove(
        'hidden', 
        'bg-red-100', 'border-red-400', 'text-red-700', 
        'bg-green-100', 'border-green-400', 'text-green-700'
    );

    if (isError) {
        messageElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
    } else {
        messageElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
    }
}


async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;
    displayMessage('', false, 'login');

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
            displayMessage(data.message || 'Credenciais inválidas.', true, 'login');
        }
    } catch (error) {
        displayMessage('Erro de conexão com o servidor.', true, 'login');
    } finally {
         if (submitButton) submitButton.disabled = false;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const submitButton = document.getElementById('registerButton');
    
    if (submitButton.disabled) {
         displayMessage('Por favor, corrija os erros no formulário.', true, 'register');
         return;
    }
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Aguarde...';
    displayMessage('', false, 'register');

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        const data = await response.json();

        if (response.status === 201) {
            displayMessage('Cadastro realizado com sucesso! Redirecionando para login...', false, 'register');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            displayMessage(data.message || 'Erro ao cadastrar.', true, 'register');
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Conta';
        }
    } catch (error) {
        displayMessage('Erro de conexão com o servidor.', true, 'register');
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Conta';
    }
}

