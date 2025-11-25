const API_BASE_URL = 'https://gestao-karate-backend.onrender.com/api/v1/users';

/* --------------------------- FORÇA DA SENHA --------------------------- */

function checkPasswordStrength() {
    const senha = document.getElementById('senha')?.value || '';
    const bar = document.getElementById('passwordStrengthBar');
    const text = document.getElementById('passwordStrengthText');

    let score = 0;

    if (senha.length >= 8) score++;
    if (/[a-z]/.test(senha)) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[!@#$%^&*]/.test(senha)) score++;

    // Atualizar barra
    switch (score) {
        case 0:
        case 1:
            bar.style.width = "20%";
            bar.style.background = "#ef4444"; // vermelho
            text.textContent = "Senha fraca";
            text.style.color = "#ef4444";
            break;

        case 2:
        case 3:
            bar.style.width = "60%";
            bar.style.background = "#f59e0b"; // amarelo
            text.textContent = "Senha intermediária";
            text.style.color = "#f59e0b";
            break;

        case 4:
        case 5:
            bar.style.width = "100%";
            bar.style.background = "#10b981"; // verde
            text.textContent = "Senha forte";
            text.style.color = "#10b981";
            break;
    }

    updateRegisterButtonState();
    return score >= 4; // senha forte
}

/* --------------------------- CONFIRMAR SENHA --------------------------- */

function checkPasswordMatch() {
    const senha = document.getElementById('senha')?.value || '';
    const confirmarSenha = document.getElementById('confirmarSenha')?.value || '';
    
    const feedback = document.getElementById('confirmar-senha-feedback');
    const confirmarInput = document.getElementById('confirmarSenha');

    const isMatch = senha === confirmarSenha && confirmarSenha.length > 0;

    if (!isMatch && confirmarSenha.length > 0) {
        feedback.classList.remove('hidden');
        confirmarInput.classList.add('border-red-500');
    } else {
        feedback.classList.add('hidden');
        confirmarInput.classList.remove('border-red-500');
    }

    updateRegisterButtonState();
    return isMatch;
}

/* --------------------------- DOMÍNIO DO EMAIL --------------------------- */

function checkEmailDomain() {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('email-feedback');

    const email = emailInput.value.toLowerCase();
    const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];

    const isValid = validDomains.some(domain => email.endsWith(domain));

    if (email && !isValid) {
        emailFeedback.classList.remove('hidden');
        emailInput.classList.add('border-red-500');
    } else {
        emailFeedback.classList.add('hidden');
        emailInput.classList.remove('border-red-500');
    }

    updateRegisterButtonState();
    return isValid;
}

/* --------------------------- BOTÃO REGISTRAR --------------------------- */

function updateRegisterButtonState() {
    const registerButton = document.getElementById('registerButton');

    const nome = document.getElementById('nome')?.value.trim();
    const email = document.getElementById('email')?.value.trim().toLowerCase();
    const senha = document.getElementById('senha')?.value || '';
    const confirmarSenha = document.getElementById('confirmarSenha')?.value || '';

    const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
    const isEmailValid = validDomains.some(domain => email.endsWith(domain));

    const isStrong = checkPasswordStrength();
    const doPasswordsMatch = senha === confirmarSenha && confirmarSenha.length > 0;

    const canEnable = nome && isEmailValid && isStrong && doPasswordsMatch;

    registerButton.disabled = !canEnable;
}

/* --------------------------- MOSTRAR / ESCONDER SENHA --------------------------- */

function togglePasswordVisibility(fieldId, iconId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);

    if (field.type === "password") {
        field.type = "text";
        icon.setAttribute('data-feather', 'eye');
    } else {
        field.type = "password";
        icon.setAttribute('data-feather', 'eye-off');
    }

    feather.replace();
}

/* --------------------------- ENVIAR FORMULÁRIO --------------------------- */

async function handleRegister(event) {
    event.preventDefault();

    const feedback = document.getElementById('feedback-message');

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            feedback.textContent = data.message || 'Erro ao criar conta.';
            feedback.style.display = 'block';
            feedback.className = 'feedback-message bg-red-100 text-red-700';
            return;
        }

        feedback.textContent = 'Conta criada com sucesso!';
        feedback.style.display = 'block';
        feedback.className = 'feedback-message bg-green-100 text-green-700';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        feedback.textContent = 'Erro inesperado.';
        feedback.style.display = 'block';
        feedback.className = 'feedback-message bg-red-100 text-red-700';
    }
}

/* --------------------------- INICIALIZAÇÃO --------------------------- */

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('register-form')?.addEventListener('submit', handleRegister);

    document.getElementById('nome')?.addEventListener('input', updateRegisterButtonState);
    document.getElementById('email')?.addEventListener('input', checkEmailDomain);

    document.getElementById('senha')?.addEventListener('input', () => {
        checkPasswordStrength();
        checkPasswordMatch();
    });

    document.getElementById('confirmarSenha')?.addEventListener('input', checkPasswordMatch);

    // Inicializar ao carregar
    checkEmailDomain();
    checkPasswordStrength();
    checkPasswordMatch();

    feather.replace();
});
