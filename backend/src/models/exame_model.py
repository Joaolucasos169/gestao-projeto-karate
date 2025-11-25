from ..database import db
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

class ExameModel(db.Model):
    __tablename__ = 'exames'

    id = db.Column(db.Integer, primary_key=True)
    nome_evento = db.Column(db.String(200), nullable=False)
    data = db.Column(db.String(20), nullable=False)   # armazenamos 'YYYY-MM-DD' string para simplicidade
    hora = db.Column(db.String(10), nullable=False)   # 'HH:MM'
    local = db.Column(db.String(200), nullable=False)
    alunos_ids = db.Column(ARRAY(db.Integer), nullable=False, default=[])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_json(self, include_alunos=False):
        base = {
            'id': self.id,
            'nome_evento': self.nome_evento,
            'data': self.data,
            'hora': self.hora,
            'local': self.local,
            'alunos_ids': self.alunos_ids or [],
            'created_at': self.created_at.isoformat()
        }
        if include_alunos:
            # busca nomes dos alunos (opcional; chamador deve importar AlunoModel para isto)
            from .aluno_model import AlunoModel
            alunos = []
            for aid in self.alunos_ids or []:
                a = AlunoModel.query.get(aid)
                if a:
                    alunos.append({'id': a.id, 'nome': a.nome, 'faixa': getattr(a, 'faixa', None)})
            base['alunos'] = alunos
        return base
