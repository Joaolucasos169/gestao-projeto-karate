// ==================== DASHBOARD PRINCIPAL ====================
document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica de Verificação de Login e Logout ---
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  const userNameElement = document.getElementById('user-name');
  const logoutButton = document.getElementById('logoutButton');
  const statsAlunosElement = document.getElementById('stats-total-alunos');
  const statsProfessoresElement = document.getElementById('stats-professores');

  if (!token || !userData) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = 'index.html';
    return;
  }

  let user = null;
  try {
    user = JSON.parse(userData);
  } catch (e) {
    console.error("Erro ao analisar dados do usuário:", e);
    handleLogout();
    return;
  }

  if (user && user.nome && userNameElement) {
    userNameElement.textContent = user.nome.split(' ')[0];
  } else if (userNameElement) {
    userNameElement.textContent = "Usuário";
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert("Sessão encerrada.");
    window.location.href = 'index.html';
  }

  if (logoutButton) logoutButton.addEventListener('click', handleLogout);

  // ==================== FUNÇÃO GENÉRICA PARA BUSCAR DADOS ====================
  async function fetchData(url, token) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        console.error(`Erro 401: Token inválido/expirado ao buscar ${url}`);
        handleLogout();
        return null;
      }
      if (!response.ok) {
        console.error(`Erro ${response.status} ao buscar ${url}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error(`Falha de rede ao buscar ${url}:`, error);
      return [];
    }
  }

  // ==================== ESTATÍSTICAS ====================
  async function loadAlunoStats() {
    const API_ALUNOS_URL = 'https://gestao-karate-backend.onrender.com/api/v1/alunos/';
    const alunos = await fetchData(API_ALUNOS_URL, token);
    if (!alunos || alunos === null) return;

    // Atualiza contador
    if (statsAlunosElement) statsAlunosElement.textContent = alunos.length;

    // ---- Calcular Faixa Etária ----
    const agora = new Date();
    const faixas = { "Até 10": 0, "11-15": 0, "16-18": 0, "19+": 0 };

    alunos.forEach((a) => {
      if (!a.data_nascimento) return;
      const nasc = new Date(a.data_nascimento);
      const idade = agora.getFullYear() - nasc.getFullYear();
      if (idade <= 10) faixas["Até 10"]++;
      else if (idade <= 15) faixas["11-15"]++;
      else if (idade <= 18) faixas["16-18"]++;
      else faixas["19+"]++;
    });

    // ---- Calcular Sexo ----
    const sexos = { Masculino: 0, Feminino: 0 };
    alunos.forEach((a) => {
      if (a.sexo === "Masculino") sexos.Masculino++;
      else if (a.sexo === "Feminino") sexos.Feminino++;
    });

    renderCharts(faixas, sexos);
  }

  async function loadProfessorStats() {
    const API_PROFESSORES_URL = 'https://gestao-karate-backend.onrender.com/api/v1/professores/';
    const professores = await fetchData(API_PROFESSORES_URL, token);
    if (statsProfessoresElement && professores !== null)
      statsProfessoresElement.textContent = professores.length;
  }

  // ==================== GRÁFICOS ====================
  function renderCharts(faixas, sexos) {
    // Garante que o Chart.js está disponível
    if (typeof Chart === "undefined") {
      console.error("Chart.js não carregado!");
      return;
    }

    // Gráfico de Faixa Etária
    const ctxFaixa = document.getElementById("graficoFaixaEtaria");
    if (ctxFaixa) {
      new Chart(ctxFaixa, {
        type: "bar",
        data: {
          labels: Object.keys(faixas),
          datasets: [
            {
              label: "Quantidade de Alunos",
              data: Object.values(faixas),
              backgroundColor: "rgba(79, 70, 229, 0.6)",
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // Gráfico de Sexo
    const ctxSexo = document.getElementById("graficoSexo");
    if (ctxSexo) {
      new Chart(ctxSexo, {
        type: "doughnut",
        data: {
          labels: Object.keys(sexos),
          datasets: [
            {
              data: Object.values(sexos),
              backgroundColor: ["#4F46E5", "#EC4899"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
          },
        },
      });
    }
  }

  // ==================== INICIALIZAÇÃO ====================
  loadAlunoStats();
  loadProfessorStats();

  // --- LÓGICA DO MENU MÓVEL ---
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu-button');
  const mainContent = document.querySelector('main');

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('hidden');

      const icon = menuButton.querySelector('i');
      if (icon) {
        icon.setAttribute('data-feather', sidebar.classList.contains('hidden') ? 'menu' : 'x');
        feather.replace();
      }
    });

    if (mainContent) {
      mainContent.addEventListener('click', () => {
        if (!sidebar.classList.contains('hidden')) {
          sidebar.classList.add('hidden');
          const icon = menuButton.querySelector('i');
          if (icon) {
            icon.setAttribute('data-feather', 'menu');
            feather.replace();
          }
        }
      });
    }
  }
});
