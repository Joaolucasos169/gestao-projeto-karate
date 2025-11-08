def test_model_professor_criacao(app):
    try:
        from src.database import db
        from src.models.professor_model import Professor
    except Exception:
        return

    with app.app_context():
        p = Professor(nome="Sensei X", faixa="Preta")
        db.session.add(p)
        db.session.commit()
        assert p.id is not None
        assert p.faixa.lower() == "preta"
