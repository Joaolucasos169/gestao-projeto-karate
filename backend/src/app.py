from flask import Flask, jsonify, request, make_response
from .database import db
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta

# Carrega variáveis de ambiente
load_dotenv()

# Importa modelos (precisa importar antes do db.create_all)
from .models.user_model import UserModel
from .models.aluno_model import AlunoModel
from .models.professor_model import ProfessorModel
from .controllers.aula_controller import aula_bp

# Importa os controladores (rotas)
from .controllers.user_controller import user_bp
from .controllers.aluno_controller import aluno_bp
from .controllers.professor_controller import professor_bp

jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Configuração de CORS
    origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://gestao-projeto-karate.vercel.app"
    ]
    
    CORS(app, 
         resources={r"/api/v1/*": {"origins": origins}}, 
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Configuração JWT
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt.init_app(app)

    # Banco de dados
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️ DATABASE_URL não encontrada. Tentando montar manualmente...")
        db_url = (
            f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
            f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        )

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    # Criação automática das tabelas no Render
    with app.app_context():
        db.create_all()
        print("✅ Todas as tabelas foram criadas/verificadas com sucesso!")

    # Registro das rotas
    app.register_blueprint(user_bp, url_prefix="/api/v1/users")
    app.register_blueprint(aluno_bp, url_prefix="/api/v1/alunos")
    app.register_blueprint(professor_bp, url_prefix="/api/v1/professores")
    app.register_blueprint(aula_bp, url_prefix="/api/v1/aulas")
    
    @app.route("/")
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app


# ✅ Este bloco garante que funcione tanto localmente quanto no Render
app = create_app()
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

# ==============================
# 🔙 VERSÃO ANTIGA (LOCAL)
# ==============================

# from flask import Flask, jsonify, request, make_response
# from .database import configure_database, db
# from flask_jwt_extended import JWTManager
# import os
# from dotenv import load_dotenv
# from flask_cors import CORS
# from datetime import timedelta

# load_dotenv() 

# from .models.user_model import UserModel 
# from .models.aluno_model import AlunoModel 
# from .models.professor_model import ProfessorModel
 
# from .controllers.user_controller import user_bp 
# from .controllers.aluno_controller import aluno_bp
# from .controllers.professor_controller import professor_bp

# jwt = JWTManager() 

# def create_app():
#     app = Flask(__name__)
    
#     origins = [
#         "http://127.0.0.1:5500",
#         "http://localhost:5500",
#     ]
    
#     CORS(app, 
#          resources={r"/api/v1/*": {"origins": origins}}, 
#          supports_credentials=True,
#          methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
#     )

#     app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
#     app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
#     jwt.init_app(app) 
    
#     db_url = os.getenv("DATABASE_URL") 
#     if not db_url:
#         print("Aviso: DATABASE_URL não definida. A usar variáveis locais (DB_HOST, etc.).")
#         db_url = (
#             f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
#             f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
#         )
    
#     app.config['SQLALCHEMY_DATABASE_URI'] = db_url
#     app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
#     db.init_app(app)
#     print("Configuração do Banco de Dados concluída.")

#     app.register_blueprint(user_bp, url_prefix='/api/v1/users') 
#     app.register_blueprint(aluno_bp, url_prefix='/api/v1/alunos')
#     app.register_blueprint(professor_bp, url_prefix='/api/v1/professores')

#     @app.route('/')
#     def index():
#         return jsonify({"message": "API de Gestão de Karatê está online!"})

#     return app

# if __name__ == '__main__':
#     app = create_app()
    
#     with app.app_context():
#         db.create_all() 
#         print("Tabelas criadas/verificadas no PostgreSQL.")
        
#     app.run(debug=True)