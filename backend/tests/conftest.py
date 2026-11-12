import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(scope="session")
def client():
    """Una única app para todas las pruebas con PostgreSQL (el pool de conexiones va ligado a su bucle)."""
    from config import get_settings

    test_db = os.getenv("COMANDERO_TEST_DATABASE_URL")
    if not test_db or get_settings().DATABASE_URL != test_db:
        pytest.skip("Indica una base PostgreSQL aislada en DATABASE_URL y COMANDERO_TEST_DATABASE_URL")
    from main import app

    with TestClient(app) as client:
        yield client
