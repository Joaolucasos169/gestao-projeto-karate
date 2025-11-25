const API_BASE_URL = 'https://gestao-karate-backend.onrender.com/api/v1';

/* ---------- Helpers ---------- */
function safeGet(id) {
  return document.getElementById(id) || null;
}

function safeText(el, text) {
  if (!el) return;
  el.textContent = text;
}

/* ---------- Password Strength (barra) ---------- */
function computePasswordScore(senha) {
  let score = 0;
  if (!senha) return 0;
  if (senha.length >= 8) score++;
  if (/[a-z]/.test(senha)) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[!@#$%^&*]/.test(senha)) score++;
  return score;
}

function updatePasswordStrengthUI() {
  const senha = safeGet('senha')?.value || '';
  const bar = safeGet('passwordStrengthBar');
  const text = safeGet('passwordStrengthText');

  if (!bar && !text) return; // nada a fazer se a UI não existir nesta página

  const score = computePasswordScore(senha);

  if (score <= 1) {
    if (bar) { bar.style.width = "20%"; bar.style.background = "#ef4444"; }
    if (text) { text.textContent = "Senha fraca"; text.style.color = "#ef4444"; }
  } else if (score <= 3) {
    if (bar) { bar.style.width = "60%"; bar.style.background = "#f59e0b"; }
    if (text) { text.textContent = "Senha intermediária"; text.style.color = "#f59e0b"; }
  } else {
    if (bar) { bar.style.width = "100%"; bar.style.background = "#10b981"; }
    if (text) { text.textContent = "Senha forte"; text.style.color = "#10b981"; }
  }

  // Retorna booleano se for forte (score >= 4)
  return score >= 4;
}

/* ---------- Email Domain Validation ---------- */
function checkEmailDomain() {
  const emailInput = safeGet('email');
  const emailFeedback = safeGet('email-feedback');
  if (!emailInput || !emailFeedback) return true; // se elementos ausentes, trate como válido (p.ex. tela de login só)

  const email = (emailInput.value || '').toLowerCase();
  const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];

  const isValid = email ? validDomains.some(domain => email.endsWith(domain)) : false;

  if (email && !isValid) {
    emailFeedback.classList.remove('hidden');
    emailInput.classList.add('border-red-500');
  } else {
    emailFeedback.classList.add('hidden');
    emailInput.classList.remove('border-red-500');
  }

  return isValid;
}

/* ---------- Password Match ---------- */
function checkPasswordMatch() {
  const senhaInput = safeGet('senha');
  const confirmarInput = safeGet('confirmarSenha');
  const feedback = safeGet('confirmar-senha-feedback');

  if (!confirmarInput || !feedback || !senhaInput) return true; // nada a validar se elementos não existem

  const senha = senhaInput.value || '';
  const confirmarSenha = confirmarInput.value || '';

  const isMatch = senha === confirmarSenha && confirmarSenha.length > 0;

  if (!isMatch && confirmarSenha.length > 0) {
    feedback.classList.remove('hidden');
    confirmarInput.classList.add('border-red-500');
  } else {
    feedback.classList.add('hidden');
    confirmarInput.classList.remove('border-red-500');
  }

  return isMatch;
}

/* ---------- Atualiza estado do botão Registrar (sem recursão) ---------- */
function updateRegisterButtonState() {
  const registerButton = safeGet('registerButton');
  if (!registerButton) return;

  const nome = safeGet('nome')?.value.trim() || '';
  const email = (safeGet('email')?.value.trim() || '').toLowerCase();
  const senha = safeGet('senha')?.value || '';
  const confirmarSenha = safeGet('confirmarSenha')?.value || '';

  const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
  const isEmailValid = email ? validDomains.some(domain => email.endsWith(domain)) : false;

  // Em vez de chamar checkPasswordStrength (que atualiza a UI), recalculamos a força aqui
  const isStrong = computePasswordScore(senha) >= 4;

  const doPasswordsMatch = senha === confirmarSenha && confirmarSenha.length > 0;

  const canEnable = nome && isEmailValid && isStrong && doPasswordsMatch;

  registerButton.disabled = !canEnable;
}

/* ---------- Toggle Password Visibility ---------- */
function togglePasswordVisibility(fieldId, iconId) {
  const field = safeGet(fieldId);
  const icon = safeGet(iconId);

  if (!field) return;
  if (field.type === "password") {
    field.type = "text";
    if (icon) { icon.setAttribute('data-feather', 'eye'); }
  } else {
    field.type = "password";
    if (icon) { icon.setAttribute('data-feather', 'eye-off'); }
  }
  if (window.feather) feather.replace();
}

/* ---------- Form submit (exemplo, mantendo sua lógica) ---------- */
async function handleRegister(event) {
  if (event) event.preventDefault();

  // Validações finais
  const nome = safeGet('nome')?.value.trim();
  const email = safeGet('email')?.value.trim();
  const senha = safeGet('senha')?.value || '';

  if (!nome || !email || !senha) {
    showFeedback('Preencha todos os campos', 'error');
    return;
  }

  if (!checkEmailDomain() || !updatePasswordStrengthUI() || !checkPasswordMatch()) {
    showFeedback('Corrija as validações antes de prosseguir', 'error');
    return;
  }

  // envio para API...
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar conta');
    showFeedback('Conta criada com sucesso!');
    setTimeout(() => window.location.href = 'index.html', 1200);
  } catch (err) {
    showFeedback(err.message || 'Erro inesperado', 'error');
  }
}

/* ---------- Feedback helper ---------- */
function showFeedback(message, type = "success") {
  const feedback = safeGet('feedback-message');
  if (!feedback) { alert(message); return; }
  feedback.textContent = message;
  feedback.className = 'feedback-message p-4 rounded-md text-sm ' + (type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  feedback.style.display = 'block';
  setTimeout(() => { if (feedback) feedback.style.display = 'none'; }, 3500);
}

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners só se os elementos existem
  const nomeEl = safeGet('nome');
  const emailEl = safeGet('email');
  const senhaEl = safeGet('senha');
  const confirmarEl = safeGet('confirmarSenha');
  const form = safeGet('register-form');

  if (nomeEl) nomeEl.addEventListener('input', updateRegisterButtonState);
  if (emailEl) emailEl.addEventListener('input', () => { checkEmailDomain(); updateRegisterButtonState(); });
  if (senhaEl) {
    senhaEl.addEventListener('input', () => {
      updatePasswordStrengthUI();
      checkPasswordMatch();
      updateRegisterButtonState(); // chama a função que não gera recursão
    });
  }
  if (confirmarEl) confirmarEl.addEventListener('input', () => { checkPasswordMatch(); updateRegisterButtonState(); });
  if (form) form.addEventListener('submit', handleRegister);

  // Inicializações seguras
  checkEmailDomain();
  updatePasswordStrengthUI();
  checkPasswordMatch();

  // Feather replace com guard
  if (window.feather) feather.replace();
});

/* ---------- LOGIN ---------- */

async function handleLogin(event) {
    event.preventDefault();

    const email = safeGet('email')?.value.trim();
    const senha = safeGet('senha')?.value.trim();

    if (!email || !senha) {
        showLoginError("Preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            showLoginError(data.message || "Credenciais inválidas.");
            return;
        }

        // Salvar token
        localStorage.setItem("token", data.token);

        // Redirecionar
        window.location.href = "dashboard.html";

    } catch (err) {
        showLoginError("Erro ao conectar ao servidor.");
    }
}

function showLoginError(msg) {
    const box = safeGet("error-message");
    if (!box) { alert(msg); return; }
    box.classList.remove("hidden");
    box.innerText = msg;
}

/* ---------- Ativar login se existir formulário ---------- */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = safeGet("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
});