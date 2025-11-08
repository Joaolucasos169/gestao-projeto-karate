import pytest
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

# ===================== CONFIGURAÇÃO DA APLICAÇÃO =====================

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # Banco temporário
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)

    # Modelo: Aluno
    class Aluno(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        nome = db.Column(db.String(80), nullable=False)
        idade = db.Column(db.Integer, nullable=False)

    # Rota inicial
    @app.route('/')
    def home():
        return "Hello, Karate!", 200

    # Rota para adicionar aluno
    @app.route('/alunos', methods=['POST'])
    def criar_aluno():
        data = request.get_json()
        novo = Aluno(nome=data['nome'], idade=data['idade'])
        db.session.add(novo)
        db.session.commit()
        return jsonify({'id': novo.id, 'nome': novo.nome, 'idade': novo.idade}), 201

    # Rota para listar alunos
    @app.route('/alunos', methods=['GET'])
    def listar_alunos():
        alunos = Aluno.query.all()
        return jsonify([
            {'id': a.id, 'nome': a.nome, 'idade': a.idade}
            for a in alunos
        ]), 200

    with app.app_context():
        db.create_all()

    return app

# ===================== FIXTURES DO CLIENTE =====================

@pytest.fixture
def client(app):
    return app.test_client()


# ===================== TESTES =====================

def test_home_route(client):
    """Verifica se a rota principal responde corretamente"""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Hello, Karate!" in response.data


def test_criar_e_listar_aluno(client):
    """Testa a criação e listagem de alunos"""
    # 1️⃣ Criar aluno
    response = client.post('/alunos', json={'nome': 'João Silva', 'idade': 14})
    assert response.status_code == 201
    data = response.get_json()
    assert data['nome'] == 'João Silva'
    assert data['idade'] == 14

    # 2️⃣ Listar alunos e confirmar presença
    response = client.get('/alunos')
    assert response.status_code == 200
    alunos = response.get_json()
    assert len(alunos) == 1
    assert alunos[0]['nome'] == 'João Silva'
