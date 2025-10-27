from flask import Flask, jsonify, request, make_response
from .database import configure_database, db
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta # Importa timedelta

load_dotenv()

# --- Importações ---
# (Mantenha as importações de Modelos e Controllers)
from .models.user_model import UserModel
from .models.aluno_model import AlunoModel
from .models.professor_model import ProfessorModel
from .controllers.user_controller import user_bp
from .controllers.aluno_controller import aluno_bp
from .controllers.professor_controller import professor_bp


# Instância Global do JWT
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # --- Configuração do CORS ---
    CORS(app)

    # --- Configuração do JWT ---
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    # NOVO: Define o tempo de expiração do token (ex: 1 hora)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt.init_app(app)

    # Configuração do Banco de Dados
    configure_database(app)

    # --- Registro dos Blueprints ---
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(aluno_bp, url_prefix='/api/v1/alunos')
    app.register_blueprint(professor_bp, url_prefix='/api/v1/professores')

    # Rota de teste
    @app.route('/')
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app

# --- Bloco de Execução Principal ---
if __name__ == '__main__':
    app = create_app()

    with app.app_context():
        db.create_all()
        print("Tabelas criadas/verificadas no PostgreSQL.")

    app.run(debug=True)

