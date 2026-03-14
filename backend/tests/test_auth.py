import pytest


# ============================================================
# POST /auth/register
# ============================================================

def test_register_success(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'João Silva',
        'email': 'joao@example.com',
        'password': 'minhasenha',
        'initialBank': 500.0
    })
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert 'token' in data
    assert data['token'] is not None
    assert data['user']['name'] == 'João Silva'
    assert data['user']['email'] == 'joao@example.com'
    assert 'id' in data['user']
    assert 'initial_bank' in data['user']
    assert float(data['user']['initial_bank']) == 500.0


def test_register_missing_fields(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'Sem Email',
        'password': 'senha123',
        'initialBank': 100.0
    })
    assert response.status_code == 400


def test_register_invalid_bank_zero(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'Zero Bank',
        'email': 'zero@example.com',
        'password': 'senha123',
        'initialBank': 0
    })
    assert response.status_code == 400


def test_register_invalid_bank_negative(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'Negative Bank',
        'email': 'negative@example.com',
        'password': 'senha123',
        'initialBank': -100
    })
    assert response.status_code == 400


def test_register_duplicate_email(client, db_session):
    payload = {
        'name': 'Duplicado',
        'email': 'dup@example.com',
        'password': 'senha123',
        'initialBank': 100.0
    }
    first = client.post('/auth/register', json=payload)
    assert first.status_code == 201

    second = client.post('/auth/register', json=payload)
    assert second.status_code == 400


def test_register_invalid_bank_string(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'String Bank',
        'email': 'stringbank@example.com',
        'password': 'senha123',
        'initialBank': 'abc'
    })
    assert response.status_code == 400


# ============================================================
# POST /auth/login
# ============================================================

def test_login_success(client, db_session):
    client.post('/auth/register', json={
        'name': 'Login User',
        'email': 'login@example.com',
        'password': 'senha123',
        'initialBank': 200.0
    })

    response = client.post('/auth/login', json={
        'email': 'login@example.com',
        'password': 'senha123'
    })
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'token' in data
    assert data['token'] is not None
    assert data['user']['email'] == 'login@example.com'
    assert 'current_balance' in data['user']
    assert 'initial_bank' in data['user']


def test_login_wrong_password(client, db_session):
    client.post('/auth/register', json={
        'name': 'Wrong Pass',
        'email': 'wrongpass@example.com',
        'password': 'correta123',
        'initialBank': 100.0
    })

    response = client.post('/auth/login', json={
        'email': 'wrongpass@example.com',
        'password': 'errada999'
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client, db_session):
    response = client.post('/auth/login', json={
        'email': 'naoexiste@example.com',
        'password': 'qualquer'
    })
    assert response.status_code == 401


def test_login_missing_fields(client, db_session):
    response = client.post('/auth/login', json={
        'email': 'semsenha@example.com'
    })
    assert response.status_code == 400


# ============================================================
# POST /auth/logout
# ============================================================

def test_logout_success(client, db_session, auth_headers):
    response = client.post('/auth/logout', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True


def test_logout_no_token(client, db_session):
    response = client.post('/auth/logout')
    assert response.status_code == 401


# ============================================================
# PUT /user/profile
# ============================================================

def test_update_profile_name(client, db_session, auth_headers):
    response = client.put('/user/profile', json={
        'name': 'Novo Nome'
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['user']['name'] == 'Novo Nome'


def test_update_profile_avatar(client, db_session, auth_headers):
    response = client.put('/user/profile', json={
        'profile_photo': 'avatar1'
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['user']['profile_photo'] == 'avatar1'


def test_update_profile_password_success(client, db_session, auth_headers):
    response = client.put('/user/profile', json={
        'current_password': 'senha123',
        'new_password': 'novasenha456'
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True

    login_response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'novasenha456'
    })
    assert login_response.status_code == 200


def test_update_profile_wrong_current_password(client, db_session, auth_headers):
    response = client.put('/user/profile', json={
        'current_password': 'senhaerrada',
        'new_password': 'novasenha456'
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 400
    assert data['success'] is False


def test_update_profile_remove_avatar(client, db_session, auth_headers):
    client.put('/user/profile', json={
        'profile_photo': 'avatar2'
    }, headers=auth_headers)

    response = client.put('/user/profile', json={
        'remove_profile_photo': True
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['user']['profile_photo'] is None


def test_update_profile_no_token(client, db_session):
    response = client.put('/user/profile', json={
        'name': 'Sem Token'
    })
    assert response.status_code == 401
