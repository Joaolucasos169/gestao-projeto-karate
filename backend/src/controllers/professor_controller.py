from flask import Blueprint, request, jsonify
from ..models.professor_model import ProfessorModel
from ..models.user_model import UserModel # Necessário para criar o login do professor
from ..database import db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

professor_bp = Blueprint('professor_bp', __name__)

# --- Rota de Criação (CREATE) ---
# Esta rota cria o PROFESSOR (dados) e o USUÁRIO (login) ao mesmo tempo.
@professor_bp.route('/', methods=['POST'])
@jwt_required() # Protege a rota (requer login)
def create_professor():

    # --- BLOCO DE VERIFICAÇÃO DE PERMISSÃO REMOVIDO TEMPORARIAMENTE ---
    # # Validação de Permissão (Exemplo: apenas admins ou professores podem criar)
    # claims = get_jwt()
    # if claims.get('nivel') != 'admin' and claims.get('nivel') != 'professor':
    #     return jsonify({"message": "Acesso não autorizado para criar professores."}), 403
    # --- FIM DO BLOCO REMOVIDO ---

    data = request.get_json()

    # Campos obrigatórios para o Professor e para o Login
    required_fields = ['nome', 'email', 'senha', 'cpf', 'data_nascimento', 'telefone', 'grau'] # Adicionado 'grau'
    if not all(key in data and data[key] for key in required_fields):
        missing = [key for key in required_fields if not (key in data and data[key])]
        return jsonify({"message": f"Dados incompletos. Campos obrigatórios: {', '.join(missing)}"}), 400

    # 1. Verificar se o email ou CPF já existem
    if UserModel.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Este e-mail já está cadastrado (Usuário)."}), 409
    if ProfessorModel.query.filter_by(cpf=data['cpf']).first():
        return jsonify({"message": "Este CPF já está cadastrado (Professor)."}), 409

    try:
        # 1. Criar o Usuário (Login)
        new_user = UserModel(
            nome=data['nome'],
            email=data['email'],
            senha=data['senha'],
            nivel_acesso='professor' # Define o nível de acesso como professor
        )
        db.session.add(new_user)
        # Faz um flush para obter o ID antes do commit completo, caso precise do ID
        db.session.flush()

        # 2. Criar o Professor (Detalhes)
        new_professor = ProfessorModel(
            nome=data['nome'],
            cpf=data['cpf'],
            # Garante que a data está no formato correto
            data_nascimento=datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date(),
            telefone=data.get('telefone'),
            endereco=data.get('endereco'),
             # Usa 'grau_faixa' como no modelo, pega de 'grau' do formulário
            grau_faixa=data.get('grau'),
            fk_usuario=new_user.id # Vincula ao login recém-criado
        )

        db.session.add(new_professor)
        db.session.commit() # Salva final

        return jsonify({
            "message": "Professor cadastrado com sucesso (Login e Detalhes).",
            "professor": new_professor.to_json()
        }), 201

    except ValueError as ve: # Captura erro de formato de data
        db.session.rollback()
        print(f"Erro de formato de dados ao cadastrar professor: {ve}")
        return jsonify({"message": f"Erro no formato dos dados: {ve}. Use AAAA-MM-DD para datas."}), 400
    except Exception as e:
        db.session.rollback()
        # É importante verificar o log do servidor para detalhes do erro
        print(f"Erro inesperado ao cadastrar professor: {e}")
        # Retorna uma mensagem genérica para o frontend
        return jsonify({"message": "Erro interno ao processar o cadastro do professor."}), 500


# --- Rota de Listagem (READ ALL) ---
@professor_bp.route('/', methods=['GET'])
@jwt_required()
def list_professores():
    try:
        professores = ProfessorModel.query.filter_by(ativo=True).all()
        return jsonify([p.to_json() for p in professores]), 200
    except Exception as e:
        print(f"Erro ao listar professores: {e}")
        return jsonify({"message": "Erro interno ao buscar professores."}), 500

# --- Rota de Detalhes (READ ONE) ---
@professor_bp.route('/<int:professor_id>', methods=['GET'])
@jwt_required()
def get_professor(professor_id):
    professor = ProfessorModel.query.get(professor_id)
    if not professor:
        return jsonify({"message": "Professor não encontrado."}), 404
    return jsonify(professor.to_json()), 200

# --- Rota de Atualização (UPDATE) ---
@professor_bp.route('/<int:professor_id>', methods=['PUT'])
@jwt_required()
def update_professor(professor_id):
    professor = ProfessorModel.query.get(professor_id)
    if not professor:
        return jsonify({"message": "Professor não encontrado para atualização."}), 404

    data = request.get_json()

    # --- Validação de Permissão (Exemplo: apenas admin pode atualizar) ---
    # claims = get_jwt()
    # if claims.get('nivel') != 'admin':
    #     return jsonify({"message": "Acesso não autorizado para atualizar."}), 403
    # --- Fim da Validação ---

    try:
        # Atualiza os campos fornecidos
        # Usar setattr é uma forma dinâmica, mas pode ser menos seguro
        # É melhor listar os campos permitidos
        allowed_updates = ['nome', 'telefone', 'endereco', 'grau_faixa', 'ativo']
        for field in allowed_updates:
            if field in data:
                setattr(professor, field, data[field])

        # Tratar data de nascimento separadamente devido à conversão
        if 'data_nascimento' in data and data['data_nascimento']:
             try:
                professor.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
             except ValueError:
                 return jsonify({"message": "Formato inválido para Data de Nascimento. Use AAAA-MM-DD."}), 400

        # Atualizar email/senha do usuário associado (requer mais lógica)
        # if 'email' in data and professor.usuario:
        #     professor.usuario.email = data['email'] # Cuidado com duplicação de email

        db.session.commit()
        return jsonify({
            "message": "Professor atualizado com sucesso.",
            "professor": professor.to_json()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar professor: {e}")
        return jsonify({"message": "Erro interno ao atualizar professor."}), 500

# --- Rota de Desativação (DELETE) ---
@professor_bp.route('/<int:professor_id>', methods=['DELETE'])
@jwt_required()
def delete_professor(professor_id):
    # --- Validação de Permissão (Exemplo: Apenas Admins podem inativar) ---
    # claims = get_jwt()
    # if claims.get('nivel') != 'admin':
    #     return jsonify({"message": "Acesso não autorizado para inativar."}), 403
    # --- Fim da Validação ---

    professor = ProfessorModel.query.get(professor_id)
    if not professor:
        return jsonify({"message": "Professor não encontrado."}), 404

    try:
        # Boa prática: inativar em vez de apagar
        professor.ativo = False
        db.session.commit()
        return jsonify({"message": f"Professor '{professor.nome}' inativado."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inativar professor: {e}")
        return jsonify({"message": "Erro interno ao inativar professor."}), 500

