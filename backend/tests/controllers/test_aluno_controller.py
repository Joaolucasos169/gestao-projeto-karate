def test_listar_alunos_nao_500(client):
    resp = client.get("/alunos")  # ajuste se for /aluno
    assert resp.status_code in (200, 204, 404)
    assert resp.status_code != 500

def test_criar_aluno_smoke(client):
    payload = {"nome": "João Teste", "idade": 12}
    resp = client.post("/alunos", json=payload)
    # se a rota existir, esperamos 201; se ainda não, não pode ser 500
    assert resp.status_code in (201, 400, 404)
    assert resp.status_code != 500
