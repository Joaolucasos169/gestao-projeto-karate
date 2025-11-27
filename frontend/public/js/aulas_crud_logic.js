// ==================== CONFIGURAÇÃO DA API ====================
const API_BASE_URL = "https://gestao-karate-backend.onrender.com/api/v1";

// ==================== UTILITÁRIOS ====================
function showFeedback(message, type = "success") {
  const feedback = document.getElementById("feedback-message");
  if (!feedback) return;
  
  feedback.textContent = message;
  feedback.className =
    "feedback-message p-4 rounded-md text-sm mb-4 " +
    (type === "success"
      ? "bg-green-100 text-green-800 border border-green-300"
      : "bg-red-100 text-red-800 border border-red-300");
  feedback.style.display = "block";
  setTimeout(() => (feedback.style.display = "none"), 4000);
}

function getToken() {
  return localStorage.getItem("token");
}

// ==================== CARREGAR PROFESSORES ====================
async function carregarProfessores(selectId = "fk_professor") {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">Carregando...</option>`;

  try {
    const response = await fetch(`${API_BASE_URL}/professores/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if(!response.ok) throw new Error("Erro ao buscar professores");

    const professores = await response.json();

    select.innerHTML = `<option value="">Selecione o professor</option>`;
    professores.forEach((prof) => {
      const opt = document.createElement("option");
      opt.value = prof.id;
      opt.textContent = prof.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro professores:", err);
    select.innerHTML = `<option value="">Erro ao carregar</option>`;
  }
}

// ==================== CARREGAR AULAS ====================
async function carregarAulas() {
  const tbody = document.getElementById("aulas-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE_URL}/aulas/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const aulas = await response.json();

    tbody.innerHTML = "";
    if (aulas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma aula cadastrada.</td></tr>`;
        return;
    }

    aulas.forEach((aula) => {
      const row = document.createElement("tr");
      const dias = Array.isArray(aula.dias_semana) ? aula.dias_semana.join(", ") : aula.dias_semana;

      row.innerHTML = `
        <td class="px-6 py-4">${aula.nome_turma}</td>
        <td class="px-6 py-4">${aula.modalidade}</td>
        <td class="px-6 py-4">${dias}</td>
        <td class="px-6 py-4">${aula.horario_inicio} - ${aula.horario_fim}</td>
        <td class="px-6 py-4">${aula.professor_nome || "-"}</td>
        <td class="px-6 py-4 flex gap-4">
            <button onclick="abrirModalEdicao(${aula.id})" class="text-blue-600 hover:underline">✏️ Editar</button>
            <button onclick="excluirAula(${aula.id})" class="text-red-600 hover:underline">🗑 Excluir</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro ao carregar aulas.</td></tr>`;
  }
}

// ==================== CRIAR AULA ====================
async function handleAulaSubmit(event) {
  event.preventDefault();

  const diasSelecionados = Array.from(
    document.querySelectorAll(".day-checkbox:checked")
  ).map((el) => el.value);

  const data = {
    nome_turma: document.getElementById("nome_turma").value.trim(),
    modalidade: document.getElementById("modalidade").value.trim(),
    horario_inicio: document.getElementById("horario_inicio").value,
    horario_fim: document.getElementById("horario_fim").value,
    fk_professor: document.getElementById("fk_professor").value,
    dias_semana: diasSelecionados,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/aulas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    showFeedback("Aula criada com sucesso!");
    event.target.reset();
    carregarAulas();
  } catch (err) {
    showFeedback(err.message, "error");
  }
}

// ==================== EXCLUIR AULA ====================
async function excluirAula(id) {
  if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/aulas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (response.ok) {
        showFeedback("Aula excluída com sucesso!");
        carregarAulas();
    } else {
        showFeedback("Erro ao excluir aula.", "error");
    }
  } catch (err) {
    showFeedback("Erro de conexão.", "error");
  }
}

// ==================== MODAL E EDIÇÃO ====================
async function abrirModalEdicao(id) {
  const modal = document.getElementById("edit-modal");
  if(!modal) return;
  
  modal.classList.remove("hidden");
  document.getElementById("edit-id").value = id;

  try {
    // Carrega aula específica
    const response = await fetch(`${API_BASE_URL}/aulas/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const aulas = await response.json();
    const aula = aulas.find((a) => a.id === id);

    if(aula) {
        document.getElementById("edit_nome_turma").value = aula.nome_turma;
        document.getElementById("edit_modalidade").value = aula.modalidade;
        document.getElementById("edit_horario_inicio").value = aula.horario_inicio;
        document.getElementById("edit_horario_fim").value = aula.horario_fim;

        // Carrega professores no select de edição
        await carregarProfessores("edit_fk_professor");
        document.getElementById("edit_fk_professor").value = aula.fk_professor;

        // Marca checkboxes
        document.querySelectorAll(".edit-day").forEach((chk) => {
           chk.checked = aula.dias_semana.includes(chk.value);
        });
    }
  } catch (e) { console.error(e); }
}

async function salvarEdicao() {
  const id = document.getElementById("edit-id").value;
  const dias = Array.from(document.querySelectorAll(".edit-day:checked")).map((d) => d.value);

  const data = {
    nome_turma: document.getElementById("edit_nome_turma").value,
    modalidade: document.getElementById("edit_modalidade").value,
    horario_inicio: document.getElementById("edit_horario_inicio").value,
    horario_fim: document.getElementById("edit_horario_fim").value,
    fk_professor: document.getElementById("edit_fk_professor").value,
    dias_semana: dias,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/aulas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });

    if (response.ok) {
        showFeedback("Aula atualizada com sucesso!");
        document.getElementById("edit-modal").classList.add("hidden");
        carregarAulas();
    } else {
        showFeedback("Erro ao atualizar.", "error");
    }
  } catch {
    showFeedback("Erro de conexão.", "error");
  }
}

// ==================== INICIALIZAÇÃO SEGURA ====================
document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
      carregarProfessores();
      carregarAulas();
  } else {
      window.location.href = 'index.html';
  }

  const form = document.getElementById("aula-form");
  if (form) form.addEventListener("submit", handleAulaSubmit);

  // Proteção: Só adiciona evento se o botão existir
  const btnSave = document.getElementById("save-edit");
  if (btnSave) btnSave.addEventListener("click", salvarEdicao);

  const btnClose = document.getElementById("close-edit");
  if (btnClose) btnClose.addEventListener("click", () => {
      document.getElementById("edit-modal").classList.add("hidden");
  });
});