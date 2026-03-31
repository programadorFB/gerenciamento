"""Testes de perfis de apostas e objetivos."""
import pytest
from decimal import Decimal


class TestBettingProfile:
    """CRUD /betting-profiles"""

    def test_get_profile(self, client, auth_headers_with_bank):
        resp = client.get('/betting-profiles', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert data['data']['risk_level'] == 5
        assert Decimal(data['data']['initial_balance']) == Decimal('1000.00')

    def test_get_profile_without_profile(self, client, auth_headers):
        resp = client.get('/betting-profiles', headers=auth_headers)
        assert resp.status_code == 404

    def test_create_profile(self, client, auth_headers):
        resp = client.post('/betting-profiles', json={
            'profile': {
                'id': 'aggressive',
                'title': 'Alto Risco',
                'description': 'Perfil agressivo',
                'features': ['Alta volatilidade'],
                'color': '#F44336',
                'icon': {'name': 'fire'},
            },
            'riskValue': 9,
            'bankroll': 2000,
            'stopLoss': 800,
            'stopLossPercentage': 40,
            'profitTarget': 5000,
        }, headers=auth_headers)
        data = resp.get_json()
        assert resp.status_code == 201
        assert data['success'] is True
        assert data['data']['risk_level'] == 9

    def test_update_profile(self, client, auth_headers_with_bank, db):
        from app.models import BettingProfile
        profile = BettingProfile.query.first()

        resp = client.put(f'/betting-profiles/{profile.id}', json={
            'stopLoss': 600,
            'profitTarget': 3000,
            'riskValue': 7,
            'stopLossPercentage': 30,
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_update_nonexistent_profile(self, client, auth_headers):
        resp = client.put('/betting-profiles/999999', json={
            'stopLoss': 100,
        }, headers=auth_headers)
        assert resp.status_code == 404


class TestObjectives:
    """CRUD /objectives"""

    def test_create_objective(self, client, auth_headers_with_bank):
        resp = client.post('/objectives', json={
            'title': 'Comprar PC',
            'description': 'PC novo para trabalho',
            'target_amount': 5000,
            'current_amount': 1000,
            'target_date': '2026-12-31',
            'priority': 'high',
            'category': 'equipment',
        }, headers=auth_headers_with_bank)
        data = resp.get_json()
        assert resp.status_code == 201
        assert data['success'] is True
        assert data['data']['title'] == 'Comprar PC'

    def test_list_objectives(self, client, auth_headers_with_bank):
        # Criar 2 objetivos
        for title in ['Obj 1', 'Obj 2']:
            client.post('/objectives', json={
                'title': title,
                'target_amount': 1000,
                'current_amount': 0,
            }, headers=auth_headers_with_bank)

        resp = client.get('/objectives', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert len(data['data']) == 2

    def test_update_objective(self, client, auth_headers_with_bank):
        resp = client.post('/objectives', json={
            'title': 'Teste update',
            'target_amount': 1000,
            'current_amount': 0,
        }, headers=auth_headers_with_bank)
        obj_id = resp.get_json()['data']['id']

        resp = client.put(f'/objectives/{obj_id}', json={
            'current_amount': 500,
            'title': 'Atualizado',
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 200
        assert resp.get_json()['data']['title'] == 'Atualizado'

    def test_objective_auto_completes(self, client, auth_headers_with_bank):
        """Objetivo marca como completed quando current >= target."""
        resp = client.post('/objectives', json={
            'title': 'Auto-complete',
            'target_amount': 1000,
            'current_amount': 0,
        }, headers=auth_headers_with_bank)
        obj_id = resp.get_json()['data']['id']

        resp = client.put(f'/objectives/{obj_id}', json={
            'current_amount': 1500,
        }, headers=auth_headers_with_bank)
        assert resp.get_json()['data']['status'] == 'completed'

    def test_delete_objective(self, client, auth_headers_with_bank):
        resp = client.post('/objectives', json={
            'title': 'Para deletar',
            'target_amount': 100,
            'current_amount': 0,
        }, headers=auth_headers_with_bank)
        obj_id = resp.get_json()['data']['id']

        resp = client.delete(f'/objectives/{obj_id}', headers=auth_headers_with_bank)
        assert resp.status_code == 200

        resp = client.get('/objectives', headers=auth_headers_with_bank)
        ids = [o['id'] for o in resp.get_json()['data']]
        assert obj_id not in ids

    def test_delete_nonexistent_objective(self, client, auth_headers_with_bank):
        resp = client.delete('/objectives/999999', headers=auth_headers_with_bank)
        assert resp.status_code == 404
