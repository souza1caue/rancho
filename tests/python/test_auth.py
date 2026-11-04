import pytest

pytestmark = [pytest.mark.api, pytest.mark.auth]


@pytest.mark.parametrize("username", ["ab", "nome com espaço", "ação", "x" * 51], ids=["curto", "espaco", "acentos", "longo"])
def test_registration_rejects_invalid_username(client, username):
    response = client.post("register", {"username": username, "password": "senha longa de teste 123"})
    assert response.status_code == 400
    assert "error" in response.data


@pytest.mark.parametrize("password", ["curta", "x" * 201], ids=["senha-curta", "senha-longa"])
def test_registration_rejects_invalid_password(client, password):
    assert client.post("register", {"username": "produtor", "password": password}).status_code == 400


def test_registration_creates_private_session_and_recovery_code(client):
    response = client.post("register", {"username": "Produtor", "name": "Maria", "password": "senha longa de teste 123"})
    assert response.status_code == 201
    assert response.data["account"]["username"] == "produtor"
    assert response.data["account"]["name"] == "Maria"
    assert len(response.data["recovery"]) == 64
    cookie = response.headers["Set-Cookie"]
    for attribute in ("HttpOnly", "Secure", "SameSite=Strict", "Path=/api"):
        assert attribute in cookie
    session = client.get("session")
    assert session.status_code == 200
    assert session.data["account"] == response.data["account"]
    assert not {"password", "password_hash", "salt", "recovery_hash"} & session.data["account"].keys()


def test_duplicate_username_does_not_replace_account(client, account):
    response = client.post("register", {"username": "produtor", "name": "Outro", "password": "outra senha longa 123"})
    assert response.status_code == 409
    assert client.get("session").data["account"]["id"] == account["account"]["id"]


def test_login_and_logout_manage_session(client, new_client, account):
    visitor = new_client()
    assert visitor.post("login", {"username": "produtor", "password": "senha errada"}).status_code == 401
    response = visitor.post("login", {"username": "produtor", "password": account["password"]})
    assert response.status_code == 200
    assert visitor.get("session").data["account"]["id"] == account["account"]["id"]
    assert visitor.post("logout", {}).status_code == 200
    assert visitor.get("session").status_code == 401
    assert visitor.get("data").status_code == 401
    assert client.get("data").status_code == 200  # A outra sessão continua válida.


def test_recovery_changes_password_and_revokes_previous_sessions(client, new_client, account, document):
    assert client.post("data", {"revision": 0, "data": document}).status_code == 200
    recovery_client = new_client()
    response = recovery_client.post("recover", {"username": "produtor", "password": "nova senha de teste 456", "recovery": account["recovery"]})
    assert response.status_code == 200
    assert response.data["recovery"] != account["recovery"]
    assert client.get("data").status_code == 401
    assert recovery_client.get("data").data["data"] == document
    assert new_client().post("login", {"username": "produtor", "password": account["password"]}).status_code == 401
    assert new_client().post("login", {"username": "produtor", "password": "nova senha de teste 456"}).status_code == 200
    assert new_client().post("recover", {"username": "produtor", "password": "outra senha de teste 789", "recovery": account["recovery"]}).status_code == 401


def test_invalid_recovery_preserves_session_and_data(client, new_client, account, document):
    client.post("data", {"revision": 0, "data": document})
    response = new_client().post("recover", {"username": "produtor", "password": "nova senha de teste 456", "recovery": "invalido"})
    assert response.status_code == 401
    assert client.get("data").data["data"] == document


def test_authentication_rate_limit_is_enforced_per_ip(client, new_client):
    for _ in range(20):
        assert client.post("login", {"username": "x", "password": "invalida"}).status_code == 400
    blocked = client.post("login", {"username": "x", "password": "invalida"})
    assert blocked.status_code == 429
    assert new_client(ip="127.0.0.2").post("login", {"username": "x", "password": "invalida"}).status_code == 400
