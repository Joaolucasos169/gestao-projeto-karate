// ==================== CONFIGURAÇÃO DA API ====================
const API_BASE = "https://gestao-karate-backend.onrender.com/api/v1";

// ==================== FUNÇÃO: FEEDBACK ====================
function showFeedback(message, type = "success") {
  const feedback = document.getElementById("feedback-message");
  feedback.textContent = message;
  feedback.className =
    "feedback-message p-4 rounded-md text-sm mb-4 " +
    (type === "success"
      ? "bg-green-100 text-green-800 border border-green-300"
      : "bg-red-100 text-red-800 border border-red-300");
  feedback.style.display = "block";
  setTimeout(() => (feedback.style.display = "none"), 4000);
}

// ==================== FUNÇÃO: OBTER TOKEN ====================
function getToken() {
  return localStorage.getItem("token");
}

// ==================== FUNÇÃO: CARREGAR PROFESSORES ====================
async function carregarProfessores() {
  const select = document.getElementById("fk_professor");
  select.innerHTML = `<option value="">Carregando professores...</option>`;

  try {
    const response = await fetch(`${API_BASE}/professores/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

    const professores = await response.json();
    select.innerHTML = `<option value="">Selecione o professor</option>`;

    professores.forEach((prof) => {
      const opt = document.createElement("option");
      opt.value = prof.id;
      opt.textContent = prof.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar professores:", err);
    select.innerHTML = `<option value="">Erro ao carregar professores</option>`;
    showFeedback("Erro ao carregar professores.", "error");
  }
}

// ==================== FUNÇÃO: CARREGAR AULAS ====================
async function carregarAulas() {
  const tbody = document.getElementById("aulas-tbody");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE}/aulas/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

    const aulas = await response.json();

    if (!aulas.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma aula cadastrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    aulas.forEach((aula) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-6 py-4">${aula.nome_turma}</td>
        <td class="px-6 py-4">${aula.modalidade}</td>
        <td class="px-6 py-4">${(aula.dias_semana || []).join(", ")}</td>
        <td class="px-6 py-4">${aula.horario_inicio} - ${aula.horario_fim}</td>
        <td class="px-6 py-4">${aula.professor_nome || "N/A"}</td>
        <td class="px-6 py-4">—</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Erro ao carregar aulas:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro ao carregar aulas.</td></tr>`;
  }
}

// ==================== FUNÇÃO: CRIAR AULA ====================
async function handleAulaSubmit(event) {
  event.preventDefault();

  const diasSelecionados = Array.from(
    document.querySelectorAll(".day-checkbox:checked")
  ).map((el) => el.value);

  if (!diasSelecionados.length) {
    document.getElementById("dias-feedback").classList.remove("hidden");
    return;
  } else {
    document.getElementById("dias-feedback").classList.add("hidden");
  }

  const data = {
    nome_turma: document.getElementById("nome_turma").value.trim(),
    modalidade: document.getElementById("modalidade").value.trim(),
    horario_inicio: document.getElementById("horario_inicio").value,
    horario_fim: document.getElementById("horario_fim").value,
    fk_professor: document.getElementById("fk_professor").value,
    dias_semana: diasSelecionados,
  };

  try {
    const response = await fetch(`${API_BASE}/aulas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao criar aula.");

    showFeedback("Aula criada com sucesso!");
    event.target.reset();
    carregarAulas();
  } catch (err) {
    console.error("Erro ao criar aula:", err);
    showFeedback(err.message, "error");
  }
}

// ==================== EVENTOS DOS DIAS DA SEMANA ====================
document.querySelectorAll(".day-label").forEach((label) => {
  label.addEventListener("click", () => {
    const checkbox = document.getElementById(label.getAttribute("for"));
    checkbox.checked = !checkbox.checked;
    label.classList.toggle("bg-indigo-600", checkbox.checked);
    label.classList.toggle("text-white", checkbox.checked);
  });
});

// ==================== EVENTO DE LOGOUT ====================
document.getElementById("logoutButton")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  carregarProfessores();
  carregarAulas();
});
