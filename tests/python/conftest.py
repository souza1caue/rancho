"""Fixtures HTTP isoladas: cada teste inicia a API real em um banco novo."""

from __future__ import annotations

import json
import queue
import shutil
import subprocess
import threading
from dataclasses import dataclass
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

import pytest

ROOT = Path(__file__).resolve().parents[2]
PASSWORD = "senha exclusiva para testes 123"
COLLECTIONS = ("animals", "milk", "health", "reproduction", "feeding", "finance", "tasks", "protocols")


@dataclass(frozen=True)
class ApiResponse:
    status_code: int
    data: dict
    headers: object


class ApiClient:
    """Cliente de teste em loopback, com sessão independente para cada usuário.

    Cookies Secure são enviados explicitamente somente neste transporte local.
    O teste verifica os atributos reais emitidos pelo handler; não simula a política
    de cookies de um navegador nem substitui um teste do runtime Cloudflare.
    """

    def __init__(self, base_url: str, *, ip: str = "127.0.0.1"):
        self.base_url = base_url
        self.ip = ip
        self.cookie = ""
        self._opener = build_opener(ProxyHandler({}))

    def request(self, method: str, path: str, payload=None, *, origin=None, raw=None):
        headers = {
            "Content-Type": "application/json",
            "Origin": self.base_url if origin is None else origin,
            "X-Test-IP": self.ip,
        }
        if self.cookie:
            headers["Cookie"] = self.cookie
        body = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
        request = Request(self.base_url + "/api/" + path, data=body, headers=headers, method=method)
        try:
            response = self._opener.open(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            value = json.loads(response.read().decode("utf-8"))
            header = response.headers.get("Set-Cookie")
            if header:
                cookies = SimpleCookie()
                cookies.load(header)
                if "rancho_session" in cookies:
                    token = cookies["rancho_session"].value
                    self.cookie = f"rancho_session={token}" if token else ""
            return ApiResponse(response.status, value, response.headers)

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, payload, **kwargs):
        return self.request("POST", path, payload, **kwargs)


@pytest.fixture
def api_url(tmp_path):
    node = shutil.which("node")
    if node is None:
        pytest.fail("Node.js 24 é necessário para testar o handler JavaScript real.")
    messages: queue.Queue[str] = queue.Queue()
    with (tmp_path / "server.log").open("w+", encoding="utf-8") as log:
        process = subprocess.Popen(
            [node, str(ROOT / "tests/support/http-api-server.mjs")],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=log,
            text=True,
            encoding="utf-8",
        )
        reader = threading.Thread(target=lambda: messages.put(process.stdout.readline()), daemon=True)
        reader.start()
        try:
            try:
                ready = messages.get(timeout=15)
            except queue.Empty:
                pytest.fail("A API local não iniciou em 15 segundos.")
            if not ready:
                log.seek(0)
                pytest.fail("Não foi possível iniciar a API local:\n" + log.read())
            url = json.loads(ready)["url"]
            assert url.startswith("http://127.0.0.1:")
            yield url
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            process.stdout.close()
            reader.join(timeout=1)


@pytest.fixture
def client(api_url):
    return ApiClient(api_url)


@pytest.fixture
def new_client(api_url):
    return lambda **kwargs: ApiClient(api_url, **kwargs)


@pytest.fixture
def account(client):
    response = client.post("register", {"username": "produtor", "name": "Produtor teste", "password": PASSWORD})
    assert response.status_code == 201
    return {**response.data, "password": PASSWORD}


@pytest.fixture
def document():
    data = {key: [] for key in COLLECTIONS}
    data["animals"] = [{"id": "cow-001", "tag": "001", "name": "Mimosa", "birth": "2024-01-01", "sex": "Fêmea", "stage": "Vaca"}]
    data["milk"] = [{"id": "milk-001", "animalId": "cow-001", "animal": "001 · Mimosa", "date": "2026-11-04", "type": "Manhã", "liters": "18.5", "destination": "Tanque"}]
    return data
