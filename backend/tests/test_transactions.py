"""Testes de transações: CRUD, saldo, validações."""
import pytest
from decimal import Decimal


class TestCreateTransaction:
    """POST /transactions"""

    def test_create_deposit(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'deposit',
            'amount': 200,
            'date': '2026-03-15',
            'description': 'Depósito extra',
            'category': 'Depósito',
        }, headers=auth_headers_with_bank)
        data = resp.get_json()
        assert resp.status_code == 201
        assert data['success'] is True
        assert data['data']['type'] == 'deposit'
        assert Decimal(data['data']['amount']) == Decimal('200')

    def test_create_withdraw(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'withdraw',
            'amount': 100,
            'date': '2026-03-15',
            'description': 'Saque',
            'category': 'Saque',
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 201

    def test_create_gains(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'gains',
            'amount': 50,
            'date': '2026-03-15',
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 201

    def test_create_losses(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'losses',
            'amount': 30,
            'date': '2026-03-15',
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 201

    def test_balance_updates_after_deposit(self, client, auth_headers_with_bank):
        """Saldo deve aumentar após depósito."""
        # Saldo inicial = 1000
        client.post('/transactions', json={
            'type': 'deposit',
            'amount': 500,
            'date': '2026-03-15',
        }, headers=auth_headers_with_bank)

        resp = client.get('/balance', headers=auth_headers_with_bank)
        balance = Decimal(resp.get_json()['balance'])
        assert balance == Decimal('1500.00')

    def test_balance_updates_after_withdraw(self, client, auth_headers_with_bank):
        """Saldo deve diminuir após saque."""
        client.post('/transactions', json={
            'type': 'withdraw',
            'amount': 300,
            'date': '2026-03-15',
        }, headers=auth_headers_with_bank)

        resp = client.get('/balance', headers=auth_headers_with_bank)
        balance = Decimal(resp.get_json()['balance'])
        assert balance == Decimal('700.00')

    def test_balance_gains_and_losses(self, client, auth_headers_with_bank):
        """Ganhos somam, perdas subtraem do saldo."""
        client.post('/transactions', json={
            'type': 'gains', 'amount': 200, 'date': '2026-03-15',
        }, headers=auth_headers_with_bank)
        client.post('/transactions', json={
            'type': 'losses', 'amount': 50, 'date': '2026-03-15',
        }, headers=auth_headers_with_bank)

        resp = client.get('/balance', headers=auth_headers_with_bank)
        balance = Decimal(resp.get_json()['balance'])
        assert balance == Decimal('1150.00')  # 1000 + 200 - 50

    def test_without_auth(self, client):
        resp = client.post('/transactions', json={
            'type': 'deposit', 'amount': 100, 'date': '2026-03-15',
        })
        assert resp.status_code == 401


class TestGetTransactions:
    """GET /transactions"""

    def test_list_transactions(self, client, auth_headers_with_bank):
        resp = client.get('/transactions', headers=auth_headers_with_bank)
        data = resp.get_json()
        assert data['success'] is True
        assert isinstance(data['data'], list)
        assert len(data['data']) >= 1  # pelo menos a transação inicial

    def test_transactions_ordered_by_date_desc(self, client, auth_headers_with_bank):
        client.post('/transactions', json={
            'type': 'deposit', 'amount': 100, 'date': '2026-01-01',
        }, headers=auth_headers_with_bank)
        client.post('/transactions', json={
            'type': 'deposit', 'amount': 200, 'date': '2026-06-01',
        }, headers=auth_headers_with_bank)

        resp = client.get('/transactions', headers=auth_headers_with_bank)
        dates = [tx['date'] for tx in resp.get_json()['data']]
        assert dates == sorted(dates, reverse=True)


class TestUpdateTransaction:
    """PUT /transactions/<id>"""

    def test_update_amount(self, client, auth_headers_with_bank):
        # Criar uma transação editável
        resp = client.post('/transactions', json={
            'type': 'deposit', 'amount': 100, 'date': '2026-03-15',
            'category': 'Teste',
        }, headers=auth_headers_with_bank)
        tx_id = resp.get_json()['data']['id']

        resp = client.put(f'/transactions/{tx_id}', json={
            'amount': 250,
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_cannot_edit_initial_bank(self, client, auth_headers_with_bank, db):
        """Transação de banca inicial não pode ser editada."""
        from app.models import Transaction
        initial_tx = Transaction.query.filter_by(is_initial_bank=True).first()

        resp = client.put(f'/transactions/{initial_tx.id}', json={
            'amount': 9999,
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 400

    def test_update_nonexistent(self, client, auth_headers_with_bank):
        resp = client.put('/transactions/999999', json={
            'amount': 100,
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 404

    def test_update_invalid_amount(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'deposit', 'amount': 100, 'date': '2026-03-15',
            'category': 'Teste',
        }, headers=auth_headers_with_bank)
        tx_id = resp.get_json()['data']['id']

        resp = client.put(f'/transactions/{tx_id}', json={
            'amount': -50,
        }, headers=auth_headers_with_bank)
        assert resp.status_code == 400


class TestDeleteTransaction:
    """DELETE /transactions/<id>"""

    def test_delete_transaction(self, client, auth_headers_with_bank):
        resp = client.post('/transactions', json={
            'type': 'deposit', 'amount': 100, 'date': '2026-03-15',
            'category': 'Para deletar',
        }, headers=auth_headers_with_bank)
        tx_id = resp.get_json()['data']['id']

        resp = client.delete(f'/transactions/{tx_id}', headers=auth_headers_with_bank)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_cannot_delete_initial_bank(self, client, auth_headers_with_bank, db):
        from app.models import Transaction
        initial_tx = Transaction.query.filter_by(is_initial_bank=True).first()

        resp = client.delete(f'/transactions/{initial_tx.id}', headers=auth_headers_with_bank)
        assert resp.status_code == 400

    def test_delete_nonexistent(self, client, auth_headers_with_bank):
        resp = client.delete('/transactions/999999', headers=auth_headers_with_bank)
        assert resp.status_code == 404

    def test_balance_after_delete(self, client, auth_headers_with_bank):
        """Saldo deve voltar ao valor anterior após deletar transação."""
        # Depositar 500
        resp = client.post('/transactions', json={
            'type': 'deposit', 'amount': 500, 'date': '2026-03-15',
        }, headers=auth_headers_with_bank)
        tx_id = resp.get_json()['data']['id']

        # Saldo = 1500
        resp = client.get('/balance', headers=auth_headers_with_bank)
        assert Decimal(resp.get_json()['balance']) == Decimal('1500.00')

        # Deletar
        client.delete(f'/transactions/{tx_id}', headers=auth_headers_with_bank)

        # Saldo volta a 1000
        resp = client.get('/balance', headers=auth_headers_with_bank)
        assert Decimal(resp.get_json()['balance']) == Decimal('1000.00')
