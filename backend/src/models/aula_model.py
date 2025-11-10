from ..database import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import ARRAY


class AulaModel(db.Model):
    __tablename__ = 'aulas'

    id = db.Column(db.Integer, primary_key=True)
    nome_turma = db.Column(db.String(100), nullable=False)
    modalidade = db.Column(db.String(50), nullable=False, default='Karatê')
    dias_semana = db.Column(ARRAY(db.String(20)), nullable=False)
    horario_inicio = db.Column(db.Time, nullable=False)
    horario_fim = db.Column(db.Time, nullable=False)
    fk_professor = db.Column(
        db.Integer,
        db.ForeignKey('professores.id', name='fk_aula_professor'),
        nullable=False
    )
    professor = db.relationship('ProfessorModel', backref='aulas')

    def to_json(self):
        return {
            'id': self.id,
            'nome_turma': self.nome_turma,
            'modalidade': self.modalidade,
            'dias_semana': self.dias_semana or [],
            'horario_inicio': self.horario_inicio.strftime('%H:%M'),
            'horario_fim': self.horario_fim.strftime('%H:%M'),
            'fk_professor': self.fk_professor,
        }
