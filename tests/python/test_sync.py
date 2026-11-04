from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy

import pytest

pytestmark = [pytest.mark.api, pytest.mark.sync]


@pytest.mark.parametrize("path", ["data", "backups", "backups/0"])
def test_private_resources_require_authentication(client, path):
    assert client.get(path).status_code == 401


def test_data_is_persisted_with_revision_and_no_cache(client, account, document):
    assert client.get("data").data["revision"] == 0
    response = client.post("data", {"revision": 0, "data": document})
    assert response.status_code == 200
    assert response.data["revision"] == 1
    saved = client.get("data")
    assert saved.data["data"] == document
    assert saved.headers["Cache-Control"] == "no-store"


def test_stale_revision_preserves_current_data_and_backup(client, account, document):
    assert client.post("data", {"revision": 0, "data": document}).status_code == 200
    attempted = deepcopy(document)
    attempted["milk"][0]["liters"] = "99"
    response = client.post("data", {"revision": 0, "data": attempted})
    assert response.status_code == 409
    assert response.data["revision"] == 1
    assert response.data["data"] == document
    assert client.get("data").data["data"] == document
    assert len(client.get("backups").data["backups"]) == 2


def test_concurrent_devices_cannot_overwrite_same_revision(client, new_client, account, document):
    devices = [new_client(ip=f"device-{i}") for i in range(2)]
    for device in devices:
        device.cookie = client.cookie
    variants = [deepcopy(document), deepcopy(document)]
    variants[0]["milk"][0]["liters"] = "20"
    variants[1]["milk"][0]["liters"] = "30"
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(device.post, "data", {"revision": 0, "data": data}) for device, data in zip(devices, variants)]
        responses = [future.result() for future in futures]
    assert sorted(r.status_code for r in responses) == [200, 409]
    winner = next(i for i, response in enumerate(responses) if response.status_code == 200)
    assert client.get("data").data["data"] == variants[winner]
    assert len(client.get("backups").data["backups"]) == 2


def test_accounts_do_not_share_records_or_backups(client, new_client, account, document):
    client.post("data", {"revision": 0, "data": document})
    other = new_client()
    assert other.post("register", {"username": "outro", "password": "outra senha de teste 123"}).status_code == 201
    assert other.get("data").data["data"]["animals"] == []
    assert other.get("backups/1").status_code == 404
    assert client.get("backups/1").data["data"] == document


@pytest.mark.parametrize("revision", [-1, "0", 1.5, None], ids=["negativa", "texto", "fracionaria", "ausente"])
def test_invalid_revision_is_rejected_without_write(client, account, document, revision):
    assert client.post("data", {"revision": revision, "data": document}).status_code == 400
    assert client.get("data").data["revision"] == 0


@pytest.mark.parametrize("invalid_kind", ["animals", "milk", "tasks", "protocols"])
def test_collections_must_be_arrays(client, account, document, invalid_kind):
    document[invalid_kind] = {}
    assert client.post("data", {"revision": 0, "data": document}).status_code == 400
    assert client.get("data").data["revision"] == 0


def test_duplicate_record_ids_are_rejected(client, account, document):
    document["milk"].append(deepcopy(document["milk"][0]))
    assert client.post("data", {"revision": 0, "data": document}).status_code == 400


@pytest.mark.parametrize("origin", ["https://outro-site.test", ""], ids=["outro-dominio", "sem-origem"])
def test_cross_origin_write_is_rejected(client, account, document, origin):
    response = client.post("data", {"revision": 0, "data": document}, origin=origin)
    assert response.status_code == 403
    assert client.get("data").data["revision"] == 0


@pytest.mark.parametrize("path", ["register", "login", "recover", "data"])
def test_malformed_json_returns_client_error(client, account, path):
    response = client.request("POST", path, raw=b'{"incomplete":')
    assert response.status_code == 400


@pytest.mark.parametrize("path", ["register", "data"])
@pytest.mark.parametrize("raw", [b"null", b"[]", b'"texto"', b"123"], ids=["null", "array", "texto", "numero"])
def test_json_body_must_be_object(client, account, path, raw):
    assert client.request("POST", path, raw=raw).status_code == 400


def test_oversized_snapshot_is_rejected_without_write(client, account, document):
    document["notes"] = "x" * 1_500_001
    response = client.post("data", {"revision": 0, "data": document})
    assert response.status_code == 413
    assert client.get("data").data["revision"] == 0


def test_oversized_authentication_payload_is_rejected(client):
    assert client.request("POST", "register", raw=b"x" * 10_001).status_code == 413
