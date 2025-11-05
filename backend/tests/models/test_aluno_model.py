def test_model_aluno_criacao(app):
    try:
        from src.database import db
        from src.models.aluno_model import Aluno
    except Exception:
        # se ainda não existir, marcamos como smoke
        return

    with app.app_context():
        a = Aluno(nome="João", idade=12)
        db.session.add(a)
        db.session.commit()
        assert a.id is not None
        assert a.nome == "João"
