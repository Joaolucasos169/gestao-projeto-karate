from flask import Blueprint, request, jsonify, make_response
from ..models.aluno_model import AlunoModel
from ..database import db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_ # Importa o 'or_' para filtros complexos

aluno_bp = Blueprint('aluno_bp', __name__)

# --- Rota READ ALL (Com Pesquisa) ---
@aluno_bp.route('/', methods=['GET'])
@jwt_required()
def list_alunos():
    """Retorna uma lista de alunos ativos, opcionalmente filtrada por nome ou CPF."""
    try:
        # Pega o parâmetro 'search' da URL (ex: /api/v1/alunos/?search=joao)
        search_term = request.args.get('search', None, type=str)

        # Começa a query base, filtrando por ativos
        query = AlunoModel.query.filter_by(ativo=True)

        # Se um termo de busca foi fornecido, adiciona filtros
        if search_term:
            search_like = f"%{search_term}%" # Prepara o termo para busca parcial (case-insensitive)
            # Filtra onde o nome CONTÉM o termo OU o CPF CONTÉM o termo
            # ilike é case-insensitive no PostgreSQL
            query = query.filter(
                or_(
                    AlunoModel.nome.ilike(search_like),
                    AlunoModel.cpf.ilike(search_like)
                )
            )

        # Executa a query final, ordenada por nome
        alunos = query.order_by(AlunoModel.nome).all()

        return jsonify([aluno.to_json() for aluno in alunos]), 200
    except Exception as e:
        print(f"Erro ao listar alunos: {e}")
        return jsonify({"message": "Erro interno ao buscar alunos."}), 500

# --- Rota CREATE ---
# (O código da rota CREATE permanece o mesmo)
@aluno_bp.route('/', methods=['POST'])
@jwt_required()
def create_aluno():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado enviado."}), 400

    required_fields = ['nome', 'cpf', 'data_nascimento', 'telefone', 'nome_pais', 'endereco', 'grau_atual']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({"message": f"Campos obrigatórios em falta ou vazios: {', '.join(missing_fields)}"}), 400

    try:
        data_nasc_str = data.get('data_nascimento')
        data_ult_grad_str = data.get('data_ultima_graduacao')
        data_nasc = datetime.strptime(data_nasc_str, '%Y-%m-%d').date() if data_nasc_str else None
        data_ult_grad = datetime.strptime(data_ult_grad_str, '%Y-%m-%d').date() if data_ult_grad_str else datetime.utcnow().date()

        if not data_nasc:
             return jsonify({"message": "Data de Nascimento é obrigatória e deve estar no formato AAAA-MM-DD."}), 400

        if AlunoModel.query.filter_by(cpf=data['cpf']).first():
            return jsonify({"message": "Este CPF já está cadastrado."}), 409

        new_aluno = AlunoModel(
            nome=data['nome'],
            cpf=data['cpf'],
            data_nascimento=data_nasc,
            telefone=data.get('telefone'),
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
        print(f"Erro de valor ao cadastrar aluno: {ve}")
        return jsonify({"message": f"Erro no formato dos dados: {ve}. Use AAAA-MM-DD."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro inesperado ao cadastrar aluno: {e}")
        return jsonify({"message": "Erro interno ao processar o cadastro."}), 500


# --- Rota READ ONE ---
# (O código da rota READ ONE permanece o mesmo)
@aluno_bp.route('/<int:aluno_id>', methods=['GET'])
@jwt_required()
def get_aluno(aluno_id):
    try:
        # Usar get_or_404 para simplificar a verificação de existência
        aluno = AlunoModel.query.get_or_404(aluno_id)
        # Verifica se o aluno encontrado está ativo (se necessário)
        # if not aluno.ativo:
        #     return jsonify({"message": "Aluno não encontrado ou inativo."}), 404
        return jsonify(aluno.to_json()), 200
    except Exception as e: # Pode capturar o 404 do get_or_404 ou outros erros
        # Se for um erro 404 específico do Werkzeug (usado pelo get_or_404)
        if hasattr(e, 'code') and e.code == 404:
             return jsonify({"message": "Aluno não encontrado."}), 404
        # Outros erros
        print(f"Erro ao buscar aluno {aluno_id}: {e}")
        return jsonify({"message": "Erro interno ao buscar aluno."}), 500


# --- Rota UPDATE ---
# (O código da rota UPDATE permanece o mesmo)
@aluno_bp.route('/<int:aluno_id>', methods=['PUT'])
@jwt_required()
def update_aluno(aluno_id):
    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado enviado para atualização."}), 400

    aluno = AlunoModel.query.get_or_404(aluno_id)

    try:
        # Atualiza apenas os campos fornecidos no JSON
        for field in ['nome', 'telefone', 'nome_pais', 'endereco', 'grau_atual']:
             if field in data:
                 setattr(aluno, field, data[field]) # Define o atributo do objeto

        # Verifica o CPF separadamente para adicionar validação de duplicidade
        if 'cpf' in data:
            new_cpf = data['cpf']
            if new_cpf != aluno.cpf: # Só verifica se o CPF mudou
                 existing_cpf = AlunoModel.query.filter(AlunoModel.cpf == new_cpf, AlunoModel.id != aluno_id).first()
                 if existing_cpf:
                     return jsonify({"message": "Este CPF já pertence a outro aluno."}), 409
                 aluno.cpf = new_cpf

        # Trata as datas
        if 'data_nascimento' in data and data['data_nascimento']:
            aluno.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
        if 'data_ultima_graduacao' in data: # Permite Nulo ou Data
             ult_grad_str = data['data_ultima_graduacao']
             aluno.data_ultima_graduacao = datetime.strptime(ult_grad_str, '%Y-%m-%d').date() if ult_grad_str else None

        # Trata o status ativo
        if 'ativo' in data:
             # Garante que o valor seja booleano
             aluno.ativo = bool(data['ativo'])

        db.session.commit()
        return jsonify({
            "message": "Dados do aluno atualizados com sucesso!",
            "aluno": aluno.to_json()
        }), 200
    except ValueError as ve: # Erro na conversão de data
        db.session.rollback()
        print(f"Erro de valor ao atualizar aluno {aluno_id}: {ve}")
        return jsonify({"message": f"Erro no formato dos dados: {ve}. Use AAAA-MM-DD."}), 400
    except Exception as e: # Outro erro (ex: BD)
        db.session.rollback()
        print(f"Erro ao atualizar aluno {aluno_id}: {e}")
        return jsonify({"message": "Erro interno ao atualizar dados."}), 500

# --- Rota DELETE ---
# (O código da rota DELETE permanece o mesmo)
@aluno_bp.route('/<int:aluno_id>', methods=['DELETE'])
@jwt_required()
def delete_aluno(aluno_id):
    aluno = AlunoModel.query.get_or_404(aluno_id)
    try:
        aluno.ativo = False # Apenas inativa
        db.session.commit()
        return jsonify({"message": f"Aluno '{aluno.nome}' foi inativado com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inativar aluno {aluno_id}: {e}")
        return jsonify({"message": "Erro interno ao inativar o aluno."}), 500

# --- Manipuladores OPTIONS (Podem ser removidos se CORS(app) estiver a funcionar) ---
# @aluno_bp.route('/', methods=['OPTIONS'])
# def handle_alunos_options():
#     # ... (código OPTIONS) ...

# @aluno_bp.route('/<int:aluno_id>', methods=['OPTIONS'])
# def handle_aluno_id_options(aluno_id):
#     # ... (código OPTIONS) ...

