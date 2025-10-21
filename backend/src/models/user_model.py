from ..database import db
from werkzeug.security import generate_password_hash, check_password_hash

class UserModel(db.Model):
    # Define o nome da tabela no PostgreSQL
    __tablename__ = 'usuarios' 

    # Colunas da Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    
    # Adicionar no futuro: nível de acesso, fk_aluno/professor, etc.
    nivel_acesso = db.Column(db.String(50), default='aluno') # Ex: 'aluno', 'professor', 'admin'

    def __init__(self, nome, email, senha, nivel_acesso='aluno'):
        self.nome = nome
        self.email = email
        self.set_password(senha)
        self.nivel_acesso = nivel_acesso

    def set_password(self, senha):
        """ Gera o hash da senha de forma segura antes de salvar. """
        self.senha_hash = generate_password_hash(senha)

    def check_password(self, senha):
        """ Verifica se a senha fornecida corresponde ao hash armazenado. """
        return check_password_hash(self.senha_hash, senha)

    def to_json(self):
        """ Retorna uma representação JSON do objeto (sem a senha hash). """
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'nivel_acesso': self.nivel_acesso
        }