import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

# Instância do SQLAlchemy
db = SQLAlchemy()

def configure_database(app):
    """ Configura e inicializa o SQLAlchemy. """
    
    # URL de Conexão (PostgreSQL + driver psycopg2)
    SQLALCHEMY_DATABASE_URL = (
        f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializa o SQLAlchemy
    db.init_app(app)
    
    print("Configuração do SQLAlchemy concluída.")