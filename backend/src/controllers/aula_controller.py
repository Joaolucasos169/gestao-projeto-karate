from flask import Blueprint, request, jsonify
from ..models.aula_model import AulaModel
from ..models.professor_model import ProfessorModel
from ..database import db
from datetime import datetime
from flask_jwt_extended import jwt_required

aula_bp = Blueprint('aula_bp', __name__)

@aula_bp.route('/', methods=['POST'])
@jwt_required()
def create_aula():
    data = request.get_json() or {}
    required = ['nome_turma', 'modalidade', 'horario_inicio', 'horario_fim', 'fk_professor', 'dias_semana']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"message": f"Campos faltando: {', '.join(missing)}"}), 400

    try:
        inicio = datetime.strptime(data['horario_inicio'], '%H:%M').time()
        fim = datetime.strptime(data['horario_fim'], '%H:%M').time()
        if fim <= inicio:
            return jsonify({"message": "Horário final deve ser após o inicial."}), 400

        prof = ProfessorModel.query.get(int(data['fk_professor']))
        if not prof:
            return jsonify({"message": "Professor não encontrado."}), 404

        nova_aula = AulaModel(
            nome_turma=data['nome_turma'],
            modalidade=data['modalidade'],
            horario_inicio=inicio,
            horario_fim=fim,
            fk_professor=prof.id,
            dias_semana=data['dias_semana']
        )

        db.session.add(nova_aula)
        db.session.commit()

        aula_json = nova_aula.to_json()
        aula_json['professor_nome'] = prof.nome

        return jsonify({"message": "Aula cadastrada com sucesso!", "aula": aula_json}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar aula: {e}")
        return jsonify({"message": "Erro interno ao criar aula."}), 500


@aula_bp.route('/', methods=['GET'])
@jwt_required()
def list_aulas():
    try:
        aulas = db.session.query(AulaModel, ProfessorModel.nome).join(ProfessorModel).order_by(AulaModel.id).all()
        result = []
        for aula, prof_nome in aulas:
            a = aula.to_json()
            a['professor_nome'] = prof_nome
            result.append(a)
        return jsonify(result)
    except Exception as e:
        print(f"Erro ao listar aulas: {e}")
        return jsonify({"message": "Erro interno ao listar aulas."}), 500


@aula_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_aula(id):
    aula = AulaModel.query.get(id)
    if not aula:
        return jsonify({"success": False, "message": "Aula não encontrada."}), 404
    try:
        db.session.delete(aula)
        db.session.commit()
        return jsonify({"success": True, "message": "Aula excluída com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao excluir aula: {e}")
        return jsonify({"success": False, "message": "Erro interno ao excluir aula."}), 500
