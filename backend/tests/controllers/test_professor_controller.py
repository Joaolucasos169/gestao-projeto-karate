def test_listar_professores_nao_500(client):
    resp = client.get("/professores")
    assert resp.status_code in (200, 204, 404)
    assert resp.status_code != 500

def test_criar_professor_smoke(client):
    payload = {"nome": "Sensei Teste", "faixa": "Preta"}
    resp = client.post("/professores", json=payload)
    assert resp.status_code in (201, 400, 404)
    assert resp.status_code != 500
