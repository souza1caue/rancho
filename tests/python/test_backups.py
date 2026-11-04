from copy import deepcopy

import pytest

pytestmark = [pytest.mark.api, pytest.mark.backup]


def test_snapshot_keeps_original_data_after_correction(client, account, document):
    client.post("data", {"revision": 0, "data": document})
    corrected = deepcopy(document)
    corrected["milk"][0]["liters"] = "22"
    assert client.post("data", {"revision": 1, "data": corrected}).status_code == 200
    assert client.get("backups/1").data["data"] == document
    assert client.get("backups/2").data["data"] == corrected
    assert client.get("data").data["data"] == corrected


def test_backup_retention_keeps_latest_thirty_versions(client, account, document):
    for revision in range(32):
        document["milk"][0]["liters"] = str(revision)
        response = client.post("data", {"revision": revision, "data": document})
        assert response.status_code == 200
    versions = client.get("backups").data["backups"]
    assert [row["revision"] for row in versions] == list(range(32, 2, -1))
    assert client.get("backups/2").status_code == 404
    assert client.get("backups/3").status_code == 200
    assert client.get("backups/32").data["data"]["milk"][0]["liters"] == "31"
