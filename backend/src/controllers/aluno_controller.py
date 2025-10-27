from flask import Blueprint, request, jsonify, make_response
from ..models.aluno_model import AlunoModel
from ..database import db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_
import re # Importa regex para limpeza

aluno_bp = Blueprint('aluno_bp', __name__)

def validar_cpf(cpf_str: str) -> bool:
    """Valida um CPF brasileiro."""
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

def limpar_e_validar_telefone(telefone_str: str) -> str | None:
    """Limpa e valida o número de telefone (10 ou 11 dígitos)."""
    if not isinstance(telefone_str, str): return None
    # Remove tudo que não for dígito
    numeros = re.sub(r'\D', '', telefone_str)
    # Verifica se tem 10 (fixo com DDD) ou 11 (celular com DDD) dígitos
    if 10 <= len(numeros) <= 11:
        return numeros # Retorna apenas os números
    else:
        return None 



@aluno_bp.route('/', methods=['GET'])
@jwt_required()
def list_alunos():
    try:
        search_term = request.args.get('search', None, type=str)
        query = AlunoModel.query.filter_by(ativo=True)
        if search_term:
            search_like = f"%{search_term}%"
            # Assume que CPF está guardado apenas com números no BD
            query = query.filter(or_(AlunoModel.nome.ilike(search_like), AlunoModel.cpf.ilike(search_like)))
        alunos = query.order_by(AlunoModel.nome).all()
        return jsonify([aluno.to_json() for aluno in alunos]), 200
    except Exception as e:
        print(f"Erro ao listar alunos: {e}")
        return jsonify({"message": "Erro interno ao buscar alunos."}), 500

@aluno_bp.route('/', methods=['POST'])
@jwt_required()
def create_aluno():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado enviado."}), 400

    required_fields = ['nome', 'cpf', 'data_nascimento', 'grau_atual'] # Ajuste conforme necessário
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({"message": f"Campos obrigatórios em falta: {', '.join(missing_fields)}"}), 400

    # --- VALIDAÇÃO CPF ---
    cpf_para_validar = data.get('cpf')
    if not validar_cpf(cpf_para_validar):
        return jsonify({"message": "CPF inválido."}), 400
    cpf_limpo = re.sub(r'\D', '', cpf_para_validar) # Guarda só números

    # --- VALIDAÇÃO TELEFONE ---
    telefone_para_validar = data.get('telefone')
    telefone_limpo = None
    if telefone_para_validar:
        telefone_limpo = limpar_e_validar_telefone(telefone_para_validar)
        if telefone_limpo is None:
            return jsonify({"message": "Telefone inválido. Deve conter 10 ou 11 dígitos (incluindo DDD)."}), 400

    try:
        data_nasc_str = data.get('data_nascimento')
        data_ult_grad_str = data.get('data_ultima_graduacao')
        data_nasc = datetime.strptime(data_nasc_str, '%Y-%m-%d').date() if data_nasc_str else None
        data_ult_grad = datetime.strptime(data_ult_grad_str, '%Y-%m-%d').date() if data_ult_grad_str else datetime.utcnow().date()

        if not data_nasc:
             return jsonify({"message": "Data de Nascimento inválida."}), 400

        if AlunoModel.query.filter_by(cpf=cpf_limpo).first():
            return jsonify({"message": "Este CPF já está cadastrado."}), 409

        new_aluno = AlunoModel(
            nome=data['nome'],
            cpf=cpf_limpo, # Salva CPF limpo
            data_nascimento=data_nasc,
            telefone=telefone_limpo, # Salva telefone limpo (ou None)
            nome_pais=data.get('nome_pais'),
            endereco=data.get('endereco'),
            grau_atual=data['grau_atual'],
            data_ultima_graduacao=data_ult_grad
        )
        db.session.add(new_aluno)
        db.session.commit()
        return jsonify({
            "message": "Aluno cadastrado com sucesso!",
            "aluno": new_aluno.to_json()
        }), 201
    except ValueError as ve:
        db.session.rollback()
        return jsonify({"message": f"Erro no formato dos dados: {ve}."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro inesperado: {e}")
        return jsonify({"message": "Erro interno ao processar cadastro."}), 500


@aluno_bp.route('/<int:aluno_id>', methods=['GET'])
@jwt_required()
def get_aluno(aluno_id):
    try:
        aluno = AlunoModel.query.get_or_404(aluno_id)
        return jsonify(aluno.to_json()), 200
    except Exception as e:
        if hasattr(e, 'code') and e.code == 404: return jsonify({"message": "Aluno não encontrado."}), 404
        print(f"Erro buscar aluno {aluno_id}: {e}")
        return jsonify({"message": "Erro interno."}), 500


@aluno_bp.route('/<int:aluno_id>', methods=['PUT'])
@jwt_required()
def update_aluno(aluno_id):
    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado enviado."}), 400

    aluno = AlunoModel.query.get_or_404(aluno_id)

    cpf_limpo = aluno.cpf 
    telefone_limpo = aluno.telefone 

    # --- VALIDAÇÃO CPF (se alterado) ---
    if 'cpf' in data:
        cpf_para_validar = data.get('cpf')
        if not validar_cpf(cpf_para_validar):
            return jsonify({"message": "CPF inválido."}), 400
        cpf_limpo_novo = re.sub(r'\D', '', cpf_para_validar)
        if cpf_limpo_novo != aluno.cpf:
            existing_cpf = AlunoModel.query.filter(AlunoModel.cpf == cpf_limpo_novo, AlunoModel.id != aluno_id).first()
            if existing_cpf:
                return jsonify({"message": "Este CPF já pertence a outro aluno."}), 409
        cpf_limpo = cpf_limpo_novo 


    if 'telefone' in data:
        telefone_para_validar = data.get('telefone')
        if telefone_para_validar: 
            telefone_limpo_novo = limpar_e_validar_telefone(telefone_para_validar)
            if telefone_limpo_novo is None:
                 return jsonify({"message": "Telefone inválido (10 ou 11 dígitos)."}), 400
            telefone_limpo = telefone_limpo_novo 
        else:
            telefone_limpo = None 

    try:
        # Atualiza campos usando os valores validados/limpos
        if 'nome' in data: aluno.nome = data['nome']
        aluno.cpf = cpf_limpo # Atualiza com o valor limpo (mesmo que não tenha mudado)
        aluno.telefone = telefone_limpo # Atualiza com o valor limpo (ou None)

        # Atualiza outros campos
        if 'nome_pais' in data: aluno.nome_pais = data.get('nome_pais')
        if 'endereco' in data: aluno.endereco = data.get('endereco')
        if 'grau_atual' in data: aluno.grau_atual = data['grau_atual']
        if 'ativo' in data: aluno.ativo = bool(data['ativo'])

        # Trata as datas
        if 'data_nascimento' in data and data['data_nascimento']:
            aluno.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
        if 'data_ultima_graduacao' in data:
             ult_grad_str = data['data_ultima_graduacao']
             aluno.data_ultima_graduacao = datetime.strptime(ult_grad_str, '%Y-%m-%d').date() if ult_grad_str else None

        db.session.commit()
        return jsonify({
            "message": "Dados atualizados com sucesso!",
            "aluno": aluno.to_json()
        }), 200
    except ValueError as ve:
        db.session.rollback()
        return jsonify({"message": f"Erro no formato dos dados: {ve}."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar: {e}")
        return jsonify({"message": "Erro interno ao atualizar."}), 500

@aluno_bp.route('/<int:aluno_id>', methods=['DELETE'])
@jwt_required()
def delete_aluno(aluno_id):
    aluno = AlunoModel.query.get_or_404(aluno_id)
    try:
        aluno.ativo = False
        db.session.commit()
        return jsonify({"message": f"Aluno '{aluno.nome}' inativado."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inativar: {e}")
        return jsonify({"message": "Erro interno ao inativar."}), 500

