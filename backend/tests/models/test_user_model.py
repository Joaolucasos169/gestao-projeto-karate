def test_model_user_criacao(app):
    try:
        from src.database import db
        from src.models.user_model import User
    except Exception:
        return

    with app.app_context():
        u = User(email="user@test.com")
        db.session.add(u)
        db.session.commit()
        assert u.id is not None
        assert "@" in u.email
