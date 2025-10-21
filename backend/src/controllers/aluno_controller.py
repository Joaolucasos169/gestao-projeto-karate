from flask import Blueprint, request, jsonify
from ..models.aluno_model import AlunoModel
from ..database import db
from datetime import datetime
# NOVO: Importa o decorador de segurança
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt 

aluno_bp = Blueprint('aluno_bp', __name__)

# Rota READ ALL: Listar todos os alunos (PROTEGIDA)
@aluno_bp.route('/', methods=['GET'])
@jwt_required() # <--- PROTEÇÃO APLICADA!
def list_alunos():
    # Opcional: Pegar a identidade do token (o ID do usuário logado)
    # current_user_id = get_jwt_identity()
    
    alunos = AlunoModel.query.filter_by(ativo=True).all()
    
    return jsonify([aluno.to_json() for aluno in alunos]), 200

# Rota CREATE: Cadastrar novo aluno (PROTEGIDA)
@aluno_bp.route('/', methods=['POST'])
@jwt_required() # <--- PROTEÇÃO APLICADA!
def create_aluno():
    data = request.get_json()
    
    # current_user_id = get_jwt_identity()
    # current_user_claims = get_jwt() # Pode pegar o 'nivel' do usuário para validações de permissão

    try:
        new_aluno = AlunoModel(
            nome=data['nome'],
            data_nascimento=datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date(), 
            grau_atual=data.get('grau_atual', 'Branca'),
        )

        db.session.add(new_aluno)
        db.session.commit()
        return jsonify({
            "message": "Aluno cadastrado com sucesso!",
            "aluno": new_aluno.to_json()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao cadastrar aluno: {e}")
        return jsonify({"message": f"Erro interno: {e}"}), 500


# Rota READ ONE: Buscar aluno por ID (PROTEGIDA)
@aluno_bp.route('/<int:aluno_id>', methods=['GET'])
@jwt_required() # <--- PROTEÇÃO APLICADA!
def get_aluno(aluno_id):
    aluno = AlunoModel.query.get(aluno_id)
    
    if not aluno:
        return jsonify({"message": "Aluno não encontrado."}), 404
        
    return jsonify(aluno.to_json()), 200

# Rota UPDATE: Atualizar dados de um aluno (PROTEGIDA)
@aluno_bp.route('/<int:aluno_id>', methods=['PUT'])
@jwt_required() # <--- PROTEÇÃO APLICADA!
def update_aluno(aluno_id):
    data = request.get_json()
    aluno = AlunoModel.query.get(aluno_id)

    if not aluno:
        return jsonify({"message": "Aluno não encontrado para atualização."}), 404

    try:
        if 'nome' in data:
            aluno.nome = data['nome']
        if 'data_nascimento' in data:
            aluno.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
        if 'grau_atual' in data:
            aluno.grau_atual = data['grau_atual']
        if 'ativo' in data:
            aluno.ativo = data['ativo']

        db.session.commit()
        return jsonify({
            "message": "Dados do aluno atualizados com sucesso!",
            "aluno": aluno.to_json()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar aluno: {e}")
        return jsonify({"message": f"Erro interno: {e}"}), 500


# Rota DELETE: Remover/Inativar um aluno (PROTEGIDA)
@aluno_bp.route('/<int:aluno_id>', methods=['DELETE'])
@jwt_required() # <--- PROTEÇÃO APLICADA!
def delete_aluno(aluno_id):
    aluno = AlunoModel.query.get(aluno_id)

    if not aluno:
        return jsonify({"message": "Aluno não encontrado para exclusão."}), 404

    try:
        aluno.ativo = False
        db.session.commit()
        return jsonify({"message": f"Aluno '{aluno.nome}' inativado com sucesso."}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inativar aluno: {e}")
        return jsonify({"message": "Erro interno do servidor ao inativar."}), 500