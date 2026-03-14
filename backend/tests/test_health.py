import pytest


def test_health_check(client, db_session):
    response = client.get('/health')
    data = response.get_json()

    assert response.status_code == 200
    assert data['status'] == 'healthy'
    assert 'timestamp' in data
    assert data['timestamp'] is not None
