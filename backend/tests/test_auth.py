"""Testes de autenticação: registro, login, logout, token."""
import pytest
from decimal import Decimal


class TestRegister:
    """POST /auth/register"""

    def test_register_success(self, client):
        resp = client.post('/auth/register', json={
            'name': 'Novo User',
            'email': 'novo@email.com',
            'password': 'Senha123!',
            'initialBank': 500,
            'riskValue': 5,
        })
        data = resp.get_json()
        assert resp.status_code == 201
        assert data['success'] is True
        assert 'token' in data
        assert data['user']['name'] == 'Novo User'
        assert data['user']['initial_bank'] == '500'

    def test_register_missing_fields(self, client):
        resp = client.post('/auth/register', json={
            'email': 'a@b.com',
            'password': '123456',
        })
        assert resp.status_code == 400

    def test_register_duplicate_email(self, client, sample_user):
        resp = client.post('/auth/register', json={
            'name': 'Dup',
            'email': 'teste@email.com',
            'password': 'Senha123!',
            'initialBank': 100,
        })
        assert resp.status_code == 400
        assert 'registrado' in resp.get_json()['error'].lower() or 'Email' in resp.get_json()['error']

    def test_register_zero_initial_bank(self, client):
        resp = client.post('/auth/register', json={
            'name': 'Zero Bank',
            'email': 'zero@email.com',
            'password': 'Senha123!',
            'initialBank': 0,
        })
        assert resp.status_code == 400

    def test_register_negative_initial_bank(self, client):
        resp = client.post('/auth/register', json={
            'name': 'Neg',
            'email': 'neg@email.com',
            'password': 'Senha123!',
            'initialBank': -100,
        })
        assert resp.status_code == 400


class TestLogin:
    """POST /auth/login"""

    def test_login_success(self, client, sample_user_with_bank):
        resp = client.post('/auth/login', json={
            'email': 'teste@email.com',
            'password': 'Senha123!',
        })
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['success'] is True
        assert 'token' in data
        assert data['user']['email'] == 'teste@email.com'

    def test_login_wrong_password(self, client, sample_user):
        resp = client.post('/auth/login', json={
            'email': 'teste@email.com',
            'password': 'errada',
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post('/auth/login', json={
            'email': 'naoexiste@email.com',
            'password': '123456',
        })
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post('/auth/login', json={'email': 'a@b.com'})
        assert resp.status_code == 400


class TestLogout:
    """POST /auth/logout"""

    def test_logout_success(self, client, auth_headers):
        resp = client.post('/auth/logout', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_logout_without_token(self, client):
        resp = client.post('/auth/logout')
        assert resp.status_code == 401


class TestTokenValidation:
    """Testa proteção de rotas com token."""

    def test_missing_token(self, client):
        resp = client.get('/balance')
        assert resp.status_code == 401

    def test_invalid_token(self, client):
        resp = client.get('/balance', headers={
            'Authorization': 'Bearer token-invalido',
        })
        assert resp.status_code == 401

    def test_expired_token(self, client):
        import jwt as pyjwt
        from datetime import datetime, timedelta
        token = pyjwt.encode(
            {'user_id': 1, 'exp': datetime.utcnow() - timedelta(hours=1)},
            'test-secret-key', algorithm='HS256',
        )
        resp = client.get('/balance', headers={
            'Authorization': f'Bearer {token}',
        })
        assert resp.status_code == 401
