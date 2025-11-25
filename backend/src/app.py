from flask import Flask, jsonify
from .database import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta

# Carrega variáveis de ambiente
load_dotenv()

# Importa modelos (precisa importar antes de iniciar o migrate)
from .models.user_model import UserModel
from .models.aluno_model import AlunoModel
from .models.professor_model import ProfessorModel

# Importa controladores
from .controllers.user_controller import user_bp
from .controllers.aluno_controller import aluno_bp
from .controllers.professor_controller import professor_bp
from .controllers.aula_controller import aula_bp
from .controllers.exame_controller import exame_bp

jwt = JWTManager()
migrate = Migrate()  # ✅ Inicializa fora da função

def create_app():
    app = Flask(__name__)

    # --- CORS ---
    CORS(
        app,
        resources={r"/api/v1/*": {"origins": [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "https://gestao-projeto-karate.vercel.app"
        ]}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # --- JWT ---
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt.init_app(app)

    # --- BANCO DE DADOS ---
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_url = (
            f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
            f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        )

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Inicializa banco e migrações (sem criar tabelas manualmente)
    db.init_app(app)
    migrate.init_app(app, db)

    # --- Rotas ---
    app.register_blueprint(user_bp, url_prefix="/api/v1/users")
    app.register_blueprint(aluno_bp, url_prefix="/api/v1/alunos")
    app.register_blueprint(professor_bp, url_prefix="/api/v1/professores")
    app.register_blueprint(aula_bp, url_prefix="/api/v1/aulas")
    app.register_blueprint(exame_bp, url_prefix="/api/v1/exames")
    
    @app.route("/")
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
