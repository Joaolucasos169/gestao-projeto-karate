from ..database import db
from datetime import datetime

class ExameModel(db.Model):
    __tablename__ = 'exames'

    id = db.Column(db.Integer, primary_key=True)
    nome_evento = db.Column(db.String(200), nullable=False)
    data = db.Column(db.String(20), nullable=False)
    hora = db.Column(db.String(10), nullable=False)
    local = db.Column(db.String(200), nullable=False)
    
    # REMOVIDO: alunos_ids = ... (Não pode ter isso!)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_json(self):
        return {
            'id': self.id,
            'nome_evento': self.nome_evento,
            'data': self.data,
            'hora': self.hora,
            'local': self.local
        }