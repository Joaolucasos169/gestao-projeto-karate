from flask import Blueprint, request, jsonify
from ..database import db
from ..models.exame_model import ExameModel
from ..models.aluno_model import AlunoModel
from flask_jwt_extended import jwt_required

exame_bp = Blueprint('exame_bp', __name__)

# -------------------------------
# CREATE
# -------------------------------
@exame_bp.route('/', methods=['POST'])
@jwt_required()
def create_exame():
    data = request.get_json() or {}

    required = ['nome_evento', 'data', 'hora', 'local', 'alunos_ids']
    missing = []

    for field in required:
        if field not in data:
            missing.append(field)
        elif isinstance(data[field], str) and not data[field].strip():
            missing.append(field)
        elif field == "alunos_ids" and (not isinstance(data[field], list) or len(data[field]) == 0):
            missing.append(field)

    if missing:
        return jsonify({'message': f'Campos faltando: {", ".join(missing)}'}), 400

    try:
        valid_ids = []
        for aid in data['alunos_ids']:
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
        print('\nERRO CRIAR EXAME:', e, '\n')
        return jsonify({'message': 'Erro interno'}), 500


# -------------------------------
# LIST
# -------------------------------
@exame_bp.route('/', methods=['GET'])
@jwt_required()
def list_exames():
    try:
        exames = ExameModel.query.order_by(ExameModel.created_at.desc()).all()
        return jsonify([ex.to_json(include_alunos=True) for ex in exames])
    except Exception as e:
        print('ERRO LISTAR EXAMES:', e)
        return jsonify({'message': 'Erro interno'}), 500


# -------------------------------
# GET ONE
# -------------------------------
@exame_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_exame(id):
    ex = ExameModel.query.get(id)
    if not ex:
        return jsonify({'message': 'Exame não encontrado'}), 404
    return jsonify(ex.to_json(include_alunos=True))


# -------------------------------
# UPDATE
# -------------------------------
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

        if "alunos_ids" in data:
            valid_ids = []
            for aid in data.get('alunos_ids', []):
                if AlunoModel.query.get(aid):
                    valid_ids.append(aid)
            ex.alunos_ids = valid_ids

        db.session.commit()

        return jsonify({'message': 'Exame atualizado', 'exame': ex.to_json(include_alunos=True)})

    except Exception as e:
        db.session.rollback()
        print('ERRO ATUALIZAR EXAME:', e)
        return jsonify({'message': 'Erro interno'}), 500


# -------------------------------
# DELETE
# -------------------------------
@exame_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_exame(id):
    ex = ExameModel.query.get(id)
    if not ex:
        return jsonify({'message': 'Exame não encontrado'}), 404

    try:
        db.session.delete(ex)
        db.session.commit()
        return jsonify({'message': 'Exame excluído'})
    except Exception as e:
        db.session.rollback()
        print('ERRO EXCLUIR EXAME:', e)
        return jsonify({'message': 'Erro interno'}), 500
