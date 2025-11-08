from flask import Flask, jsonify
from src.database import db
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta
import sys

# -------------------------------------------------------
# 🔍 DETECÇÃO DO MODO DE TESTE
# -------------------------------------------------------
IS_TEST = (
    "pytest" in sys.modules
    or os.getenv("PYTEST_CURRENT_TEST") is not None
    or os.getenv("FLASK_ENV") == "testing"
)

# -------------------------------------------------------
# 🌱 CARREGAMENTO DAS VARIÁVEIS DE AMBIENTE
# -------------------------------------------------------
if IS_TEST:
    load_dotenv(".env.test") if os.path.exists(".env.test") else load_dotenv()
    print("🧪 Ambiente de TESTE detectado (usando SQLite em memória)")
else:
    load_dotenv()

# -------------------------------------------------------
# 📦 IMPORTAÇÕES DE MODELOS E CONTROLADORES
# -------------------------------------------------------
from src.models.user_model import UserModel
from src.models.aluno_model import AlunoModel
from src.models.professor_model import ProfessorModel
from src.controllers.aula_controller import aula_bp
from src.controllers.user_controller import user_bp
from src.controllers.aluno_controller import aluno_bp
from src.controllers.professor_controller import professor_bp

jwt = JWTManager()


# -------------------------------------------------------
# 🧱 FUNÇÃO PRINCIPAL DE CRIAÇÃO DA APP
# -------------------------------------------------------
def create_app():
    app = Flask(__name__)

    # ---------------------------------------------------
    # 🌐 CORS
    # ---------------------------------------------------
    origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://gestao-projeto-karate.vercel.app",
    ]
    CORS(
        app,
        resources={r"/api/v1/*": {"origins": origins}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # ---------------------------------------------------
    # 🔐 JWT
    # ---------------------------------------------------
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "secret-for-tests")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt.init_app(app)

    # ---------------------------------------------------
    # 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS
    # ---------------------------------------------------
    if IS_TEST:
        db_url = "sqlite:///:memory:"
        print("🧩 Usando banco SQLite em memória para testes")
    else:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("⚠️ DATABASE_URL não encontrada. Tentando montar manualmente...")
            host = os.getenv("DB_HOST") or "localhost"
            user = os.getenv("DB_USER") or "postgres"
            password = os.getenv("DB_PASSWORD") or "postgres"
            port = os.getenv("DB_PORT") or "5432"
            name = os.getenv("DB_NAME") or "postgres"
            db_url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"

        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    # ---------------------------------------------------
    # 🧾 CRIAÇÃO DAS TABELAS (LOCAL E TESTE)
    # ---------------------------------------------------
    with app.app_context():
        db.create_all()
        print("✅ Todas as tabelas foram criadas/verificadas com sucesso!")

    # ---------------------------------------------------
    # 🚏 REGISTRO DAS ROTAS
    # ---------------------------------------------------
    app.register_blueprint(user_bp, url_prefix="/api/v1/users")
    app.register_blueprint(aluno_bp, url_prefix="/api/v1/alunos")
    app.register_blueprint(professor_bp, url_prefix="/api/v1/professores")
    app.register_blueprint(aula_bp, url_prefix="/api/v1/aulas")

    # ---------------------------------------------------
    # 🏠 ROTA PRINCIPAL
    # ---------------------------------------------------
    @app.route("/")
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app


# -------------------------------------------------------
# 🚀 EXECUÇÃO LOCAL / PRODUÇÃO (Render, Vercel etc.)
# -------------------------------------------------------
if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
