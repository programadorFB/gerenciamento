import pytest


def _setup_profile(client, headers):
    client.post('/betting-profiles', json={
        'bankroll': 1000.0,
        'stopLoss': 200.0,
        'stopLossPercentage': 20.0,
        'profitTarget': 500.0,
        'riskValue': 5,
        'profile': {
            'id': 'balanced',
            'title': 'Perfil Teste',
            'description': 'Perfil para testes de analytics',
            'features': [],
            'color': '#ff5500',
            'icon': {'name': 'chart'}
        }
    }, headers=headers)


# ============================================================
# GET /analytics/overview
# ============================================================

def test_analytics_overview(client, db_session, auth_headers):
    _setup_profile(client, auth_headers)

    response = client.get('/analytics/overview', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'current_balance' in data['data']
    assert 'initial_balance' in data['data']
    assert 'total_deposits' in data['data']
    assert 'total_withdrawals' in data['data']
    assert 'real_profit' in data['data']
    assert 'roi_percentage' in data['data']
    assert 'stop_loss' in data['data']
    assert 'profit_target' in data['data']
    assert 'risk_level' in data['data']


# ============================================================
# GET /analytics/monthly
# ============================================================

def test_analytics_monthly_default(client, db_session, auth_headers):
    response = client.get('/analytics/monthly', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert isinstance(data['data'], list)


def test_analytics_monthly_custom(client, db_session, auth_headers):
    response = client.get('/analytics/monthly?months=3', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert isinstance(data['data'], list)


# ============================================================
# GET /stats/performance
# ============================================================

def test_stats_performance_monthly(client, db_session, auth_headers):
    response = client.get('/stats/performance?period=monthly', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['data']['period'] == 'monthly'
    assert 'total_sessions' in data['data']
    assert 'winning_sessions' in data['data']
    assert 'win_rate' in data['data']
    assert 'total_profit' in data['data']
    assert 'avg_session_result' in data['data']
    assert 'best_session' in data['data']
    assert 'worst_session' in data['data']
    assert 'initial_balance' in data['data']


def test_stats_performance_daily(client, db_session, auth_headers):
    response = client.get('/stats/performance?period=daily', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['data']['period'] == 'daily'
    assert 'total_sessions' in data['data']


# ============================================================
# GET /stats/risk-analysis
# ============================================================

def test_risk_analysis_no_profile(client, db_session):
    reg_resp = client.post('/auth/register', json={
        'name': 'Sem Perfil Risk',
        'email': 'semperfil_risk@example.com',
        'password': 'senha123',
        'initialBank': 500.0
    })
    token = reg_resp.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Desativar perfil padrão criado no register
    from app import db as _db
    from app.models import BettingProfile, User
    from app import create_app
    app = create_app('testing')
    with app.app_context():
        user = User.query.filter_by(email='semperfil_risk@example.com').first()
        if user:
            BettingProfile.query.filter_by(user_id=user.id).update({'is_active': False})
            _db.session.commit()

    response = client.get('/stats/risk-analysis', headers=headers)
    assert response.status_code == 404


def test_risk_analysis_with_profile(client, db_session, auth_headers):
    _setup_profile(client, auth_headers)

    response = client.get('/stats/risk-analysis', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'current_balance' in data['data']
    assert 'risk_level' in data['data']
    assert 'risk_status' in data['data']
    assert 'stop_loss' in data['data']
    assert 'profit_target' in data['data']
    assert 'drawdown' in data['data']
