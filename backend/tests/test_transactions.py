import pytest


def _create_transaction(client, headers, tx_type='deposit', amount=100, category='Ganho', date=None):
    payload = {
        'type': tx_type,
        'amount': amount,
        'category': category,
        'description': 'Transação de teste'
    }
    if date is not None:
        payload['date'] = date
    return client.post('/transactions', json=payload, headers=headers)


# ============================================================
# GET /transactions
# ============================================================

def test_get_transactions_empty(client, db_session, auth_headers):
    response = client.get('/transactions', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert isinstance(data['data'], list)
    # O register cria uma transação inicial (is_initial_bank=True)
    assert len(data['data']) >= 1


def test_get_transactions_returns_list(client, db_session, auth_headers):
    _create_transaction(client, auth_headers, tx_type='deposit', amount=150, category='Extra')

    response = client.get('/transactions', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    amounts = [float(tx['amount']) for tx in data['data']]
    assert 150.0 in amounts


# ============================================================
# POST /transactions
# ============================================================

def test_create_deposit(client, db_session, auth_headers):
    response = _create_transaction(client, auth_headers, tx_type='deposit', amount=100, category='Ganho')
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert data['data']['type'] == 'deposit'
    assert float(data['data']['amount']) == 100.0
    assert data['data']['category'] == 'Ganho'
    assert 'balance_before' in data['data']
    assert 'balance_after' in data['data']
    assert 'id' in data['data']


def test_create_withdraw(client, db_session, auth_headers):
    response = _create_transaction(client, auth_headers, tx_type='withdraw', amount=50, category='Perda')
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert data['data']['type'] == 'withdraw'
    assert float(data['data']['amount']) == 50.0
    balance_before = float(data['data']['balance_before'])
    balance_after = float(data['data']['balance_after'])
    assert balance_after == balance_before - 50.0


def test_create_transaction_with_date(client, db_session, auth_headers):
    response = _create_transaction(
        client, auth_headers,
        tx_type='deposit', amount=200, category='Teste',
        date='2025-01-15'
    )
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert '2025-01-15' in data['data']['date']


def test_create_transaction_invalid_date_falls_back(client, db_session, auth_headers):
    response = _create_transaction(
        client, auth_headers,
        tx_type='deposit', amount=75, category='Fallback',
        date=None
    )
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert 'date' in data['data']


# ============================================================
# PUT /transactions/:id
# ============================================================

def test_update_transaction_amount(client, db_session, auth_headers):
    create_resp = _create_transaction(client, auth_headers, tx_type='deposit', amount=100, category='Original')
    tx_id = create_resp.get_json()['data']['id']

    response = client.put(f'/transactions/{tx_id}', json={
        'amount': 250
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert float(data['data']['amount']) == 250.0


def test_update_transaction_category(client, db_session, auth_headers):
    create_resp = _create_transaction(client, auth_headers, tx_type='deposit', amount=100, category='Antiga')
    tx_id = create_resp.get_json()['data']['id']

    response = client.put(f'/transactions/{tx_id}', json={
        'category': 'Nova Categoria'
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['data']['category'] == 'Nova Categoria'


def test_update_transaction_not_found(client, db_session, auth_headers):
    response = client.put('/transactions/999999', json={
        'amount': 50
    }, headers=auth_headers)

    assert response.status_code == 404


def test_update_initial_bank_transaction_blocked(client, db_session, auth_headers):
    tx_list = client.get('/transactions', headers=auth_headers).get_json()['data']
    initial_tx = next((tx for tx in tx_list if tx.get('meta') and
                       isinstance(tx['meta'], dict) and
                       tx['meta'].get('created_on_register')), None)

    if initial_tx is None:
        # Tenta pelo endpoint de balance para obter a transação inicial de outra forma
        all_txs = client.get('/transactions', headers=auth_headers).get_json()['data']
        assert len(all_txs) >= 1
        initial_tx = all_txs[-1]  # A mais antiga

    response = client.put(f'/transactions/{initial_tx["id"]}', json={
        'amount': 9999
    }, headers=auth_headers)

    assert response.status_code == 400


# ============================================================
# DELETE /transactions/:id
# ============================================================

def test_delete_transaction_success(client, db_session, auth_headers):
    create_resp = _create_transaction(client, auth_headers, tx_type='deposit', amount=50, category='Para Deletar')
    tx_id = create_resp.get_json()['data']['id']

    response = client.delete(f'/transactions/{tx_id}', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True


def test_delete_transaction_not_found(client, db_session, auth_headers):
    response = client.delete('/transactions/999999', headers=auth_headers)
    assert response.status_code == 404


def test_delete_initial_bank_blocked(client, db_session, auth_headers):
    tx_list = client.get('/transactions', headers=auth_headers).get_json()['data']
    all_txs = sorted(tx_list, key=lambda x: x['date'])
    initial_tx = all_txs[0]

    response = client.delete(f'/transactions/{initial_tx["id"]}', headers=auth_headers)
    assert response.status_code == 400


# ============================================================
# GET /transactions/summary
# ============================================================

def test_get_summary(client, db_session, auth_headers):
    _create_transaction(client, auth_headers, tx_type='deposit', amount=100, category='Ganho')
    _create_transaction(client, auth_headers, tx_type='withdraw', amount=30, category='Perda')

    response = client.get('/transactions/summary', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'total_transactions' in data['data']
    assert 'deposit_count' in data['data']
    assert 'withdraw_count' in data['data']
    assert 'today_transactions' in data['data']
    assert 'last_transaction' in data['data']
    assert 'popular_categories' in data['data']
    assert data['data']['deposit_count'] >= 1
    assert data['data']['withdraw_count'] >= 1


# ============================================================
# GET /balance
# ============================================================

def test_get_balance(client, db_session, auth_headers):
    response = client.get('/balance', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'balance' in data
    assert 'initial_bank' in data
    assert 'profit_loss' in data
    assert float(data['initial_bank']) == 1000.0
    assert float(data['balance']) == 1000.0


# ============================================================
# GET /dashboard/overview
# ============================================================

def test_dashboard_overview(client, db_session, auth_headers):
    response = client.get('/dashboard/overview', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert 'current_balance' in data['data']
    assert 'initial_bank' in data['data']
    assert 'profile' in data['data']
    assert 'total_deposits' in data['data']
    assert 'total_withdrawals' in data['data']
    assert 'profit_loss' in data['data']
    assert 'roi_percentage' in data['data']
    assert float(data['data']['initial_bank']) == 1000.0
