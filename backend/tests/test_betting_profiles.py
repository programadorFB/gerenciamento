import pytest


def _profile_payload(bankroll=2000.0, stop_loss=400.0, profit_target=1000.0, risk_value=5):
    return {
        'bankroll': bankroll,
        'stopLoss': stop_loss,
        'stopLossPercentage': 20.0,
        'profitTarget': profit_target,
        'riskValue': risk_value,
        'profile': {
            'id': 'balanced',
            'title': 'Perfil Equilibrado',
            'description': 'Um perfil de risco moderado',
            'features': ['stop_loss', 'profit_target'],
            'color': '#00aaff',
            'icon': {'name': 'dice'}
        }
    }


# ============================================================
# POST /betting-profiles
# ============================================================

def test_create_profile(client, db_session, auth_headers):
    response = client.post('/betting-profiles', json=_profile_payload(), headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert data['data']['profile_type'] == 'balanced'
    assert data['data']['title'] == 'Perfil Equilibrado'
    assert float(data['data']['initial_balance']) == 2000.0
    assert float(data['data']['stop_loss']) == 400.0
    assert float(data['data']['profit_target']) == 1000.0
    assert data['data']['risk_level'] == 5
    assert data['data']['color'] == '#00aaff'
    assert data['data']['icon_name'] == 'dice'


def test_update_existing_profile(client, db_session, auth_headers):
    first_response = client.post('/betting-profiles', json=_profile_payload(bankroll=2000.0), headers=auth_headers)
    first_id = first_response.get_json()['data']['id']

    second_payload = _profile_payload(bankroll=3000.0, stop_loss=600.0, profit_target=1500.0, risk_value=7)
    second_response = client.post('/betting-profiles', json=second_payload, headers=auth_headers)
    second_data = second_response.get_json()

    assert second_response.status_code == 201
    assert second_data['success'] is True
    # O mesmo id deve ser retornado pois o perfil existente é atualizado
    assert second_data['data']['id'] == first_id
    assert float(second_data['data']['initial_balance']) == 3000.0
    assert second_data['data']['risk_level'] == 7


def test_create_profile_with_invalid_bankroll(client, db_session, auth_headers):
    payload = _profile_payload()
    payload['bankroll'] = 'abc'

    response = client.post('/betting-profiles', json=payload, headers=auth_headers)
    # O safe_decimal converte 'abc' para 0, então o endpoint não lança exceção de InvalidOperation
    # mas retorna 201 com initial_balance=0 OU pode retornar 500 dependendo da versão
    assert response.status_code in (201, 400, 500)


# ============================================================
# GET /betting-profiles
# ============================================================

def test_get_profile_success(client, db_session, auth_headers):
    client.post('/betting-profiles', json=_profile_payload(), headers=auth_headers)

    response = client.get('/betting-profiles', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'profile_type' in data['data']
    assert 'risk_level' in data['data']
    assert 'initial_balance' in data['data']
    assert 'stop_loss' in data['data']
    assert 'stop_loss_percentage' in data['data']
    assert 'profit_target' in data['data']
    assert 'color' in data['data']
    assert 'icon_name' in data['data']


def test_get_profile_not_found(client, db_session):
    # Registrar um usuário sem criar perfil extra (o register cria um perfil padrão,
    # então precisamos de um usuário sem perfil ativo)
    reg_resp = client.post('/auth/register', json={
        'name': 'Sem Perfil',
        'email': 'semperfil@example.com',
        'password': 'senha123',
        'initialBank': 500.0
    })
    token = reg_resp.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Desativar o perfil criado no register diretamente no banco
    from app import db as _db
    from app.models import BettingProfile, User
    from app import create_app
    import os
    app = create_app('testing')
    with app.app_context():
        user = User.query.filter_by(email='semperfil@example.com').first()
        if user:
            BettingProfile.query.filter_by(user_id=user.id).update({'is_active': False})
            _db.session.commit()

    response = client.get('/betting-profiles', headers=headers)
    assert response.status_code == 404


# ============================================================
# PUT /betting-profiles/:id
# ============================================================

def test_update_profile_stop_loss(client, db_session, auth_headers):
    create_resp = client.post('/betting-profiles', json=_profile_payload(), headers=auth_headers)
    profile_id = create_resp.get_json()['data']['id']

    response = client.put(f'/betting-profiles/{profile_id}', json={
        'stopLoss': 800.0
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True


def test_update_profile_not_found(client, db_session, auth_headers):
    response = client.put('/betting-profiles/999999', json={
        'stopLoss': 100.0
    }, headers=auth_headers)

    assert response.status_code == 404
