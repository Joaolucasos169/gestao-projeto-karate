from flask import Blueprint, request, jsonify
from ..models.user_model import UserModel
from ..database import db
from flask_jwt_extended import create_access_token 

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    
    if not data or not all(key in data for key in ['nome', 'email', 'senha']):
        return jsonify({"message": "Dados incompletos fornecidos."}), 400

    if UserModel.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Este e-mail já está cadastrado."}), 409

    try:
        new_user = UserModel(
            nome=data['nome'],
            email=data['email'],
            senha=data['senha'], 
            nivel_acesso='aluno'
        )

        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Usuário cadastrado com sucesso.",
            "user": new_user.to_json()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Erro interno do servidor ao cadastrar."}), 500

@user_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()

    if not data or not all(key in data for key in ['email', 'senha']):
        return jsonify({"message": "E-mail e senha são obrigatórios."}), 400

    user = UserModel.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['senha']):
        
        # Correção: user.id é Integer, convertemos para String
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims={
                'nivel': user.nivel_acesso,
                'nome': user.nome
            }
        )
        
        return jsonify({
            "message": "Login bem-sucedido!",
            "token": access_token, 
            "user": user.to_json()
        }), 200
    else:
        return jsonify({"message": "Credenciais inválidas."}), 401