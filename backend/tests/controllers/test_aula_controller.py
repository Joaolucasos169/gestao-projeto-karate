def test_listar_aulas_nao_500(client):
    resp = client.get("/aulas")
    assert resp.status_code in (200, 204, 404)
    assert resp.status_code != 500

def test_criar_aula_smoke(client):
    payload = {"titulo": "Aula de Kata", "data": "2025-11-05"}
    resp = client.post("/aulas", json=payload)
    assert resp.status_code in (201, 400, 404)
    assert resp.status_code != 500
