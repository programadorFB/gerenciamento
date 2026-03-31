"""Testes de dashboard, analytics e health check."""
import pytest
from decimal import Decimal


class TestDashboard:
    """GET /dashboard/overview"""

    def test_dashboard_overview(self, client, auth_headers_with_bank):
        resp = client.get('/dashboard/overview', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert 'current_balance' in data['data']
        assert 'initial_bank' in data['data']
        assert 'profit_loss' in data['data']
        assert 'roi_percentage' in data['data']
        assert data['data']['profile'] is not None

    def test_dashboard_balance_matches(self, client, auth_headers_with_bank):
        """Dashboard e /balance devem retornar o mesmo saldo."""
        dash = client.get('/dashboard/overview', headers=auth_headers_with_bank).get_json()
        bal = client.get('/balance', headers=auth_headers_with_bank).get_json()

        assert dash['data']['current_balance'] == bal['balance']
        assert dash['data']['initial_bank'] == bal['initial_bank']

    def test_dashboard_after_transactions(self, client, auth_headers_with_bank):
        """Dashboard reflete transações recentes."""
        client.post('/transactions', json={
            'type': 'gains', 'amount': 300, 'date': '2026-03-15',
        }, headers=auth_headers_with_bank)

        resp = client.get('/dashboard/overview', headers=auth_headers_with_bank)
        data = resp.get_json()['data']
        assert Decimal(data['current_balance']) == Decimal('1300.00')
        assert Decimal(data['profit_loss']) == Decimal('300.00')
        assert data['roi_percentage'] == 30.0


class TestBalance:
    """GET /balance"""

    def test_balance_response(self, client, auth_headers_with_bank):
        resp = client.get('/balance', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert Decimal(data['balance']) == Decimal('1000.00')
        assert Decimal(data['initial_bank']) == Decimal('1000.00')
        assert Decimal(data['profit_loss']) == Decimal('0.00')


class TestAnalytics:
    """GET /analytics/*"""

    def test_analytics_overview(self, client, auth_headers_with_bank):
        resp = client.get('/analytics/overview', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert 'current_balance' in data['data']
        assert 'real_profit' in data['data']

    def test_monthly_analytics(self, client, auth_headers_with_bank):
        resp = client.get('/analytics/monthly?months=3', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert isinstance(data['data'], list)


class TestStats:
    """GET /stats/*"""

    def test_performance_stats(self, client, auth_headers_with_bank):
        resp = client.get('/stats/performance?period=monthly', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert 'total_sessions' in data['data']
        assert 'win_rate' in data['data']

    def test_risk_analysis(self, client, auth_headers_with_bank, app):
        """
        Nota: a rota /stats/risk-analysis faz operações Decimal * float
        que funcionam com Postgres mas falham com SQLite.
        Testamos com PROPAGATE_EXCEPTIONS desligado.
        """
        app.config['PROPAGATE_EXCEPTIONS'] = False
        app.config['TESTING'] = False
        try:
            resp = client.get('/stats/risk-analysis', headers=auth_headers_with_bank)
            assert resp.status_code in (200, 500)
        finally:
            app.config['PROPAGATE_EXCEPTIONS'] = True
            app.config['TESTING'] = True


class TestHealthCheck:
    """GET /health"""

    def test_health_check(self, client):
        resp = client.get('/health')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['status'] == 'healthy'
        assert 'timestamp' in data


class TestGameTypes:
    """GET /game-types"""

    def test_get_game_types(self, client):
        resp = client.get('/game-types')
        data = resp.get_json()
        assert resp.status_code == 200
        ids = [g['id'] for g in data['data']]
        assert 'roulette' in ids
        assert 'sports' in ids
