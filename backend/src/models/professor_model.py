from ..database import db
from datetime import datetime
# A relação precisa importar UserModel para funcionar
from .user_model import UserModel

class ProfessorModel(db.Model):
    __tablename__ = 'professores'

    id = db.Column(db.Integer, primary_key=True)

    # Informações Pessoais
    nome = db.Column(db.String(120), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    endereco = db.Column(db.String(255), nullable=True) # Campo de endereço

    # Relação com a conta de login (obrigatório para professor)
    fk_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id', name='fk_professor_usuario'), unique=True, nullable=False)
    usuario = db.relationship('UserModel', backref='professor', uselist=False, foreign_keys=[fk_usuario])

    # Informações de Karatê
    grau_faixa = db.Column(db.String(50), nullable=True) # O controller envia 'grau'
    data_contratacao = db.Column(db.Date, default=datetime.utcnow)

    # Status
    ativo = db.Column(db.Boolean, default=True)

    def to_json(self):
        """ Retorna uma representação JSON do objeto Professor. """
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'telefone': self.telefone,
            'endereco': self.endereco, # Adicionado ao JSON
            'grau_faixa': self.grau_faixa,
            'data_contratacao': self.data_contratacao.isoformat() if self.data_contratacao else None,
            'ativo': self.ativo,
            'fk_usuario': self.fk_usuario
            # Opcional: incluir alguns dados do usuário (login)
            # 'usuario_email': self.usuario.email if self.usuario else None
        }

