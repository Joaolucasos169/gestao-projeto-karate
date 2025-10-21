from flask import Flask, jsonify
from .database import configure_database, db
from .controllers.user_controller import user_bp
from .controllers.aluno_controller import aluno_bp
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

# =======================================================
# IMPORTAÇÃO DE TODOS OS MODELS (CRUCIAL PARA db.create_all())
# =======================================================
from .models.user_model import UserModel 
from .models.aluno_model import AlunoModel 
from .models.professor_model import ProfessorModel 
# =======================================================

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    jwt.init_app(app)
    
    configure_database(app)
    app.register_blueprint(user_bp, url_prefix='/api/v1/users') 
    app.register_blueprint(aluno_bp, url_prefix='/api/v1/alunos')

    @app.route('/')
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        # Esta função irá agora criar todas as tabelas (usuarios, alunos, professores)
        # porque todos os Models foram importados acima.
        db.create_all() 
        print("Tabelas criadas/verificadas no PostgreSQL.")
        
    app.run(debug=True)
