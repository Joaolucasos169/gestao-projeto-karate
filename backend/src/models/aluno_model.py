# backend/src/models/aluno_model.py

from ..database import db
from datetime import datetime

class AlunoModel(db.Model):
    __tablename__ = 'alunos' 

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    
    # Relação com a tabela de usuários (Para quem faz o login)
    # Assume-se que um usuário (login) está ligado a um aluno.
    fk_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), unique=True, nullable=True)
    usuario = db.relationship('UserModel', backref='aluno', uselist=False) 
    
    # Informações de Karatê
    grau_atual = db.Column(db.String(50), default='Branca') # Ex: Branca, Amarela, Roxa, Preta
    data_ultima_graduacao = db.Column(db.Date, default=datetime.utcnow)
    data_proxima_graduacao = db.Column(db.Date, nullable=True)
    
    # Status
    ativo = db.Column(db.Boolean, default=True) # Para inativar alunos sem deletar
    
    def to_json(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'grau_atual': self.grau_atual,
            'data_ultima_graduacao': self.data_ultima_graduacao.isoformat() if self.data_ultima_graduacao else None,
            'data_proxima_graduacao': self.data_proxima_graduacao.isoformat() if self.data_proxima_graduacao else None,
            'ativo': self.ativo,
            'fk_usuario': self.fk_usuario
        }