from ..database import db
from datetime import datetime
from .user_model import UserModel 

class ProfessorModel(db.Model):
    __tablename__ = 'professores'

    id = db.Column(db.Integer, primary_key=True)
    
    # Informações Pessoais
    nome = db.Column(db.String(120), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    
    # Relação com a conta de login (obrigatório para professor)
    fk_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), unique=True, nullable=False)
    usuario = db.relationship('UserModel', backref='professor', uselist=False) 

    # Informações de Karatê
    grau_faixa = db.Column(db.String(50), nullable=False) # Ex: Shodan (Preta 1º Dan), Nidan, etc.
    data_contratacao = db.Column(db.Date, default=datetime.utcnow)

    # Status
    ativo = db.Column(db.Boolean, default=True)

    def to_json(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'telefone': self.telefone,
            'grau_faixa': self.grau_faixa,
            'data_contratacao': self.data_contratacao.isoformat() if self.data_contratacao else None,
            'ativo': self.ativo,
            'fk_usuario': self.fk_usuario
        }
