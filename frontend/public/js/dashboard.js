// ==================== DASHBOARD PRINCIPAL ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Dashboard carregando...");

  // --- Lógica de Verificação de Login e Logout ---
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  const userNameElement = document.getElementById('user-name');
  const logoutButton = document.getElementById('logoutButton');
  const statsAlunosElement = document.getElementById('stats-total-alunos');
  const statsProfessoresElement = document.getElementById('stats-professores');

  // Protege para evitar erro de sessão expirada por carregamento rápido
  if (!token || !userData || userData.trim() === "") {
    console.warn("TOKEN OU USER AUSENTE NO DASHBOARD", { token, userData });
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

  // Exibir nome do usuário
  if (user && user.nome && userNameElement) {
    userNameElement.textContent = user.nome.split(' ')[0];
  } else if (userNameElement) {
    userNameElement.textContent = "Usuário";
  }

  // --- Função de Logout Global ---
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert("Sessão encerrada.");
    window.location.href = 'index.html';
  }

  if (logoutButton) logoutButton.addEventListener('click', handleLogout);

  // ==================== FETCH PADRÃO ====================
  async function fetchData(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        console.error("⚠ Token expirado ao tentar: ", url);
        handleLogout();
        return null;
      }

      if (!response.ok) {
        console.error(`Erro ${response.status} ao acessar ${url}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro de rede ao acessar ${url}:`, error);
      return [];
    }
  }

  // ==================== ESTATÍSTICAS DE ALUNOS ====================
  async function loadAlunoStats() {
    const API = 'https://gestao-karate-backend.onrender.com/api/v1/alunos/';

    const alunos = await fetchData(API);
    if (!alunos) return;

    statsAlunosElement.textContent = alunos.length;

    const agora = new Date();
    const faixas = { "Até 10": 0, "11-15": 0, "16-18": 0, "19+": 0 };
    const sexos = { Masculino: 0, Feminino: 0 };

    alunos.forEach(a => {
      // Sexo
      if (a.sexo === "Masculino") sexos.Masculino++;
      else if (a.sexo === "Feminino") sexos.Feminino++;

      // Idade
      if (!a.data_nascimento) return;
      const nasc = new Date(a.data_nascimento);
      const idade = agora.getFullYear() - nasc.getFullYear();

      if (idade <= 10) faixas["Até 10"]++;
      else if (idade <= 15) faixas["11-15"]++;
      else if (idade <= 18) faixas["16-18"]++;
      else faixas["19+"]++;
    });

    renderCharts(faixas, sexos);
  }

  // ==================== ESTATÍSTICAS DE PROFESSORES ====================
  async function loadProfessorStats() {
    const API = 'https://gestao-karate-backend.onrender.com/api/v1/professores/';
    const professores = await fetchData(API);

    if (professores) {
      statsProfessoresElement.textContent = professores.length;
    }
  }

  // ==================== GRÁFICOS ====================
  function renderCharts(faixas, sexos) {
    if (typeof Chart === "undefined") {
      console.error("Chart.js não está carregado!");
      return;
    }

    // Faixa Etária
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
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Sexo
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
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }
  }

  // ==================== INICIALIZAÇÃO ====================
  await loadAlunoStats();
  await loadProfessorStats();

  // --- MENU MOBILE ---
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu-button');
  const mainContent = document.querySelector('main');

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('hidden');

      const icon = menuButton.querySelector('i');
      if (icon) {
        icon.setAttribute(
          'data-feather',
          sidebar.classList.contains('hidden') ? 'menu' : 'x'
        );
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
