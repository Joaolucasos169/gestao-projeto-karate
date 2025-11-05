from ..database import db
from datetime import datetime
import os
from sqlalchemy import JSON, String, Column, Time, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY


class AulaModel(db.Model):
    __tablename__ = 'aulas'

    id = Column(Integer, primary_key=True)
    nome_turma = Column(String(100), nullable=False)
    modalidade = Column(String(50), nullable=False, default='Karatê')
    horario_inicio = Column(Time, nullable=False)
    horario_fim = Column(Time, nullable=False)
    fk_professor = Column(
        Integer,
        ForeignKey('professores.id', name='fk_aula_professor'),
        nullable=False
    )

    professor = db.relationship('ProfessorModel', backref='aulas')

    # ⚙️ definimos o tipo dinamicamente no construtor
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Detecta se o banco é SQLite
        db_url = os.getenv("DATABASE_URL", "")
        is_sqlite = db_url.startswith("sqlite") or "sqlite" in db_url or os.getenv("FLASK_ENV") == "testing"

        # Define dinamicamente o tipo da coluna
        if is_sqlite:
            # Adiciona coluna JSON em tempo de execução se não existir
            if not hasattr(self.__table__.c, "dias_semana"):
                self.__table__.append_column(Column("dias_semana", JSON, nullable=False, default=list))
        else:
            if not hasattr(self.__table__.c, "dias_semana"):
                self.__table__.append_column(Column("dias_semana", ARRAY(String(20)), nullable=False))

    def to_json(self):
        return {
            'id': self.id,
            'nome_turma': self.nome_turma,
            'modalidade': self.modalidade,
            'dias_semana': getattr(self, "dias_semana", []) or [],
            'horario_inicio': (
                self.horario_inicio.strftime('%H:%M')
                if self.horario_inicio else None
            ),
            'horario_fim': (
                self.horario_fim.strftime('%H:%M')
                if self.horario_fim else None
            ),
            'fk_professor': self.fk_professor,
        }
