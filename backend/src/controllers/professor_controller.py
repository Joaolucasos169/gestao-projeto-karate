from flask import Blueprint, request, jsonify
from ..models.professor_model import ProfessorModel
from ..models.user_model import UserModel
from ..database import db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import re

professor_bp = Blueprint('professor_bp', __name__)

def validar_cpf(cpf_str: str) -> bool:
    if not isinstance(cpf_str, str): return False
    numeros = [int(digito) for digito in cpf_str if digito.isdigit()]
    if len(numeros) != 11: return False
    if len(set(numeros)) == 1: return False
    soma_produtos1 = sum(a * b for a, b in zip(numeros[0:9], range(10, 1, -1)))
    digito_esperado1 = (soma_produtos1 * 10 % 11) % 10
    if numeros[9] != digito_esperado1: return False
    soma_produtos2 = sum(a * b for a, b in zip(numeros[0:10], range(11, 1, -1)))
    digito_esperado2 = (soma_produtos2 * 10 % 11) % 10
    if numeros[10] != digito_esperado2: return False
    return True

@professor_bp.route('/', methods=['POST'])
@jwt_required()
def create_professor():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado enviado."}), 400

    required_fields = ['nome', 'email', 'senha', 'cpf', 'data_nascimento', 'telefone', 'grau']
    missing_fields = [f for f in required_fields if not data.get(f)]
    if missing_fields:
        return jsonify({"message": f"Campos obrigatórios em falta: {', '.join(missing_fields)}"}), 400

    cpf_para_validar = data.get('cpf')
    if not validar_cpf(cpf_para_validar):
        return jsonify({"message": "CPF inválido."}), 400
    cpf_limpo = re.sub(r'\D', '', cpf_para_validar)

    if UserModel.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email já cadastrado (Usuário)."}), 409
    if ProfessorModel.query.filter_by(cpf=cpf_limpo).first():
        return jsonify({"message": "CPF já cadastrado (Professor)."}), 409

    try:
        data_nasc_str = data.get('data_nascimento')
        data_nasc = datetime.strptime(data_nasc_str, '%Y-%m-%d').date() if data_nasc_str else None
        if not data_nasc:
            return jsonify({"message": "Data de Nascimento inválida."}), 400

        new_user = UserModel(
            nome=data['nome'],
            email=data['email'],
            senha=data['senha'],
            nivel_acesso='professor'
        )
        db.session.add(new_user)
        db.session.flush() # Para obter o ID antes do commit final, se necessário

        new_professor = ProfessorModel(
            nome=data['nome'],
            cpf=cpf_limpo,
            data_nascimento=data_nasc,
            telefone=data.get('telefone'),
            endereco=data.get('endereco'),
            grau_faixa=data.get('grau'), # Assume que 'grau' vem do frontend
            fk_usuario=new_user.id
        )
        db.session.add(new_professor)
        db.session.commit()

        return jsonify({
            "message": "Professor cadastrado com sucesso.",
            "professor": new_professor.to_json()
        }), 201

    except ValueError as ve:
         db.session.rollback()
         return jsonify({"message": f"Erro no formato dos dados: {ve}."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao cadastrar professor: {e}")
        # Considerar logar o erro completo aqui
        return jsonify({"message": "Erro interno ao processar o cadastro do professor."}), 500

@professor_bp.route('/', methods=['GET'])
@jwt_required()
def list_professores():
    try:
        professores = ProfessorModel.query.filter_by(ativo=True).order_by(ProfessorModel.nome).all()
        return jsonify([p.to_json() for p in professores]), 200
    except Exception as e:
        print(f"Erro ao listar professores: {e}")
        return jsonify({"message": "Erro interno ao buscar professores."}), 500

@professor_bp.route('/<int:professor_id>', methods=['GET'])
@jwt_required()
def get_professor(professor_id):
    professor = ProfessorModel.query.get(professor_id) # Usar get é mais simples que get_or_404 aqui
    if not professor:
        return jsonify({"message": "Professor não encontrado."}), 404
    # Poderia verificar if professor.ativo aqui se necessário
    return jsonify(professor.to_json()), 200

@professor_bp.route('/<int:professor_id>', methods=['PUT'])
@jwt_required()
def update_professor(professor_id):
    professor = ProfessorModel.query.get(professor_id)
    if not professor:
        return jsonify({"message": "Professor não encontrado."}), 404

    data = request.get_json()
    if not data:
         return jsonify({"message": "Nenhum dado enviado para atualização."}), 400

    cpf_limpo = professor.cpf # Padrão é o CPF existente

    if 'cpf' in data:
        cpf_para_validar = data.get('cpf')
        if not validar_cpf(cpf_para_validar):
            return jsonify({"message": "CPF inválido."}), 400
        cpf_limpo_novo = re.sub(r'\D', '', cpf_para_validar)
        if cpf_limpo_novo != professor.cpf:
            existing_cpf = ProfessorModel.query.filter(ProfessorModel.cpf == cpf_limpo_novo, ProfessorModel.id != professor_id).first()
            if existing_cpf:
                return jsonify({"message": "Este CPF já pertence a outro professor."}), 409
        cpf_limpo = cpf_limpo_novo # Define o valor a ser salvo

    try:
        # Atualiza campos se presentes nos dados
        if 'nome' in data: professor.nome = data['nome']
        professor.cpf = cpf_limpo # Salva o CPF validado/limpo
        if 'telefone' in data: professor.telefone = data.get('telefone')
        if 'endereco' in data: professor.endereco = data.get('endereco')
        if 'grau' in data: professor.grau_faixa = data.get('grau') # Assume que frontend envia 'grau'
        if 'ativo' in data: professor.ativo = bool(data['ativo'])

        if 'data_nascimento' in data and data['data_nascimento']:
             try:
                 professor.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
             except ValueError:
                  return jsonify({"message": "Formato inválido para Data de Nascimento."}), 400

        db.session.commit()
        return jsonify({
            "message": "Professor atualizado com sucesso.",
            "professor": professor.to_json()
        }), 200
    except ValueError as ve: # Captura outros ValueErrors que não sejam de data (improvável aqui)
        db.session.rollback()
        return jsonify({"message": f"Erro nos dados fornecidos: {ve}."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar professor {professor_id}: {e}")
        return jsonify({"message": "Erro interno ao atualizar professor."}), 500

@professor_bp.route('/<int:professor_id>', methods=['DELETE'])
@jwt_required()
def delete_professor(professor_id):
    professor = ProfessorModel.query.get(professor_id)
    if not professor:
        return jsonify({"message": "Professor não encontrado."}), 404

    try:
        professor.ativo = False
        db.session.commit()
        return jsonify({"message": f"Professor '{professor.nome}' foi inativado."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inativar professor {professor_id}: {e}")
        return jsonify({"message": "Erro interno ao inativar professor."}), 500

