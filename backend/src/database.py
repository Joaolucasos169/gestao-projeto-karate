import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def configure_database(app):
    # Pega a variável DATABASE_URL diretamente (Render fornece assim)
    database_url = os.getenv('DATABASE_URL')

    # Render usa o prefixo "postgres://" às vezes — ajusta para SQLAlchemy
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://")

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Cria as tabelas automaticamente no primeiro start
    with app.app_context():
        db.create_all()
