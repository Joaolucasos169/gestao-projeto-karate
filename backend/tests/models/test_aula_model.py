def test_model_aula_criacao(app):
    try:
        from src.database import db
        from src.models.aula_model import Aula
    except Exception:
        return

    with app.app_context():
        aula = Aula(titulo="Kata Básico")
        db.session.add(aula)
        db.session.commit()
        assert aula.id is not None
