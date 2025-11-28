from ..database import db

class InscricaoModel(db.Model):
    __tablename__ = 'inscricoes'

    id = db.Column(db.Integer, primary_key=True)
    fk_exame = db.Column(db.Integer, db.ForeignKey('exames.id'), nullable=False)
    fk_aluno = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    
    nota_kihon = db.Column(db.Float, default=0.0)
    nota_kata = db.Column(db.Float, default=0.0)
    nota_kumite = db.Column(db.Float, default=0.0)
    nota_gerais = db.Column(db.Float, default=0.0)
    media_final = db.Column(db.Float, default=0.0)
    aprovado = db.Column(db.Boolean, default=False)
    observacao = db.Column(db.String(255), nullable=True)

    # Relacionamentos para facilitar pegar o nome do aluno depois
    aluno = db.relationship('AlunoModel', backref='inscricoes')
    
    def to_json(self):
        return {
            "id": self.id,
            "aluno_nome": self.aluno.nome,
            "aluno_faixa": self.aluno.grau_atual,
            "notas": {
                "kihon": self.nota_kihon,
                "kata": self.nota_kata,
                "kumite": self.nota_kumite,
                "gerais": self.nota_gerais
            },
            "media": self.media_final,
            "aprovado": self.aprovado,
            "observacao": self.observacao
        }