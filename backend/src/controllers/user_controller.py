from flask import Blueprint, request, jsonify
from ..models.user_model import UserModel
from ..database import db

# Cria um Blueprint (como um mini-aplicativo) para agrupar rotas de usuário
user_bp = Blueprint('user_bp', __name__)

# Rota para Cadastro de Novo Usuário (POST /api/v1/users/register)
@user_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    
    # 1. Validação simples
    if not data or not all(key in data for key in ['nome', 'email', 'senha']):
        return jsonify({"message": "Dados incompletos fornecidos."}), 400

    # 2. Verificar se o e-mail já existe
    if UserModel.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Este e-mail já está cadastrado."}), 409

    try:
        # 3. Criar a instância do modelo
        new_user = UserModel(
            nome=data['nome'],
            email=data['email'],
            senha=data['senha'], # O modelo gera o hash automaticamente
            nivel_acesso='aluno' # Default: todo novo usuário é aluno
        )

        # 4. Salvar no banco de dados
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Usuário cadastrado com sucesso.",
            "user": new_user.to_json()
        }), 201

    except Exception as e:
        db.session.rollback() # Em caso de erro, desfaz a transação
        print(f"Erro ao registrar usuário: {e}")
        return jsonify({"message": "Erro interno do servidor ao cadastrar."}), 500


# Rota para Login de Usuário (POST /api/v1/users/login)
@user_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()

    if not data or not all(key in data for key in ['email', 'senha']):
        return jsonify({"message": "E-mail e senha são obrigatórios."}), 400

    # 1. Buscar o usuário pelo e-mail
    user = UserModel.query.filter_by(email=data['email']).first()

    # 2. Verificar usuário e senha
    if user and user.check_password(data['senha']):
        # ATENÇÃO: Em um projeto real, aqui você geraria e retornaria um JWT (token)
        # Por enquanto, retornaremos apenas os dados do usuário.
        
        return jsonify({
            "message": "Login bem-sucedido!",
            "token": "SEU_TOKEN_AQUI", # Substituir por JWT futuramente
            "user": user.to_json()
        }), 200
    else:
        return jsonify({"message": "Credenciais inválidas."}), 401