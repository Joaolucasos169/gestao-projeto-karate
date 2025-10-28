from ..database import db
from datetime import datetime
from .user_model import UserModel 

class AlunoModel(db.Model):
    __tablename__ = 'alunos' 

    id = db.Column(db.Integer, primary_key=True)
    
    # Informações Pessoais Detalhadas
    nome = db.Column(db.String(120), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=True) # CPF pode ser NULL se for menor
    data_nascimento = db.Column(db.Date, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    
    # Endereço (Pode ser uma string única para simplificar, ou separar em outra tabela)
    endereco = db.Column(db.String(255), nullable=True)
    
    # Informações dos Pais/Responsáveis
    nome_pais = db.Column(db.String(120), nullable=True)
    
    # Relação com a conta de login
    fk_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), unique=True, nullable=True)
    usuario = db.relationship('UserModel', backref='aluno', uselist=False) 
    
    # Informações de Karatê
    grau_atual = db.Column(db.String(50), default='Branca')
    data_ultima_graduacao = db.Column(db.Date, default=datetime.utcnow)
    data_proxima_graduacao = db.Column(db.Date, nullable=True)
    
    # Status
    ativo = db.Column(db.Boolean, default=True)

    def to_json(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'telefone': self.telefone,
            'endereco': self.endereco,
            'nome_pais': self.nome_pais,
            'grau_atual': self.grau_atual,
            'data_ultima_graduacao': self.data_ultima_graduacao.isoformat() if self.data_ultima_graduacao else None,
            'data_proxima_graduacao': self.data_proxima_graduacao.isoformat() if self.data_proxima_graduacao else None,
            'ativo': self.ativo,
            'fk_usuario': self.fk_usuario
        }