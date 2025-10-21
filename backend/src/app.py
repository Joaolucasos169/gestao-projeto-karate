from flask import Flask, jsonify
from .database import configure_database, db
from .models.user_model import UserModel 
from .controllers.user_controller import user_bp 

def create_app():
    app = Flask(__name__)
    configure_database(app)
    # 2. Registra os Blueprints (quando criados)
    app.register_blueprint(user_bp, url_prefix='/api/v1/users') 

    # Rota de teste
    @app.route('/')
    def index():
        return jsonify({"message": "API de Gestão de Karatê está online!"})

    return app

# Usamos este bloco para inicializar e rodar APENAS o app.py 
# de forma a testar a conexão/tabelas
if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        # ATENÇÃO: Se não houver erro aqui, a conexão com o PostgreSQL deu certo!
        db.create_all() 
        print("Tabelas criadas/verificadas no PostgreSQL.")
        
    app.run(debug=True)