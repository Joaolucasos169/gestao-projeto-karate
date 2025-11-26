from flask import Blueprint, request, jsonify
from ..database import db
from ..models.exame_model import ExameModel
from ..models.aluno_model import AlunoModel
from flask_jwt_extended import jwt_required

exame_bp = Blueprint('exame_bp', __name__)

@exame_bp.route('/', methods=['POST'])
@jwt_required()
def create_exame():
    data = request.get_json() or {}
    required = ['nome_evento', 'data', 'hora', 'local', 'alunos_ids']
    missing = [f for f in required if not data.get(f) and data.get(f) != []]
    if missing:
        return jsonify({'message': f'Campos faltando: {", ".join(missing)}'}), 400

    try:
        # opcional: validar que alunos existem
        valid_ids = []
        for aid in data.get('alunos_ids', []):
            aluno = AlunoModel.query.get(aid)
            if aluno:
                valid_ids.append(aid)
        exame = ExameModel(
            nome_evento=data['nome_evento'],
            data=data['data'],
            hora=data['hora'],
            local=data['local'],
            alunos_ids=valid_ids
        )
        db.session.add(exame)
        db.session.commit()
        return jsonify({'message': 'Exame criado', 'exame': exame.to_json(True)}), 201
    except Exception as e:
        db.session.rollback()
        print('Erro criar exame:', e)
        return jsonify({'message': 'Erro interno'}), 500

@exame_bp.route('/', methods=['GET'])
@jwt_required()
def list_exames():
    try:
        exames = ExameModel.query.order_by(ExameModel.created_at.desc()).all()
        result = []
        for ex in exames:
            result.append(ex.to_json(include_alunos=True))
        return jsonify(result)
    except Exception as e:
        print('Erro listar exames:', e)
        return jsonify({'message': 'Erro interno'}), 500

@exame_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_exame(id):
    ex = ExameModel.query.get(id)
    if not ex:
        return jsonify({'message': 'Exame não encontrado'}), 404
    return jsonify(ex.to_json(include_alunos=True))

@exame_bp.route('/<int:id>', methods=['PATCH'])
@jwt_required()
def update_exame(id):
    ex = ExameModel.query.get(id)
    if not ex:
        return jsonify({'message': 'Exame não encontrado'}), 404
    data = request.get_json() or {}
    try:
        ex.nome_evento = data.get('nome_evento', ex.nome_evento)
        ex.data = data.get('data', ex.data)
        ex.hora = data.get('hora', ex.hora)
        ex.local = data.get('local', ex.local)
        if 'alunos_ids' in data:
            # opcional: validar ids
            valid = []
            for aid in data.get('alunos_ids', []):
                from ..models.aluno_model import AlunoModel
                if AlunoModel.query.get(aid):
                    valid.append(aid)
            ex.alunos_ids = valid
        db.session.commit()
        return jsonify({'message': 'Exame atualizado', 'exame': ex.to_json(include_alunos=True)}), 200
    except Exception as e:
        db.session.rollback()
        print('Erro atualizar exame:', e)
        return jsonify({'message': 'Erro interno'}), 500

@exame_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_exame(id):
    ex = ExameModel.query.get(id)
    if not ex:
        return jsonify({'message': 'Exame não encontrado'}), 404
    try:
        db.session.delete(ex)
        db.session.commit()
        return jsonify({'message': 'Exame excluído'}), 200
    except Exception as e:
        db.session.rollback()
        print('Erro excluir exame:', e)
        return jsonify({'message': 'Erro interno'}), 500
