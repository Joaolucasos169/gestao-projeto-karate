# backend/tests/conftest.py
import sys
import os
import pytest

# ✅ Garante que a pasta src seja encontrada
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_PATH = os.path.join(BASE_DIR, 'src')
if SRC_PATH not in sys.path:
    sys.path.insert(0, SRC_PATH)

from src.app import create_app


def _config_sqlite_memory(app):
    """Configura banco SQLite em memória para testes isolados."""
    try:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        from src.database import db
        with app.app_context():
            db.create_all()
    except Exception as e:
        print(f"⚠️ Aviso: Banco de dados não inicializado nos testes: {e}")


@pytest.fixture
def app():
    flask_app = create_app()
    flask_app.config["TESTING"] = True
    _config_sqlite_memory(flask_app)
    return flask_app


@pytest.fixture
def client(app):
    """Cliente HTTP para simular requisições"""
    return app.test_client()
