import pytest


def _create_objective(client, headers, title='Meta de Teste', target_amount=500.0,
                      current_amount=0.0, priority='medium', category='savings',
                      target_date=None):
    payload = {
        'title': title,
        'target_amount': target_amount,
        'current_amount': current_amount,
        'priority': priority,
        'category': category
    }
    if target_date:
        payload['target_date'] = target_date
    return client.post('/objectives', json=payload, headers=headers)


# ============================================================
# POST /objectives
# ============================================================

def test_create_objective(client, db_session, auth_headers):
    response = _create_objective(
        client, auth_headers,
        title='Comprar Notebook',
        target_amount=3000.0,
        current_amount=500.0,
        priority='high',
        category='equipment'
    )
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert data['data']['title'] == 'Comprar Notebook'
    assert float(data['data']['target_amount']) == 3000.0
    assert float(data['data']['current_amount']) == 500.0
    assert 'status' in data['data']
    assert 'id' in data['data']


def test_create_objective_with_date(client, db_session, auth_headers):
    response = _create_objective(
        client, auth_headers,
        title='Férias',
        target_amount=2000.0,
        current_amount=0.0,
        target_date='2025-12-31'
    )
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert 'id' in data['data']


# ============================================================
# GET /objectives
# ============================================================

def test_get_objectives_empty(client, db_session, auth_headers):
    response = client.get('/objectives', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert isinstance(data['data'], list)
    assert len(data['data']) == 0


def test_get_objectives_with_data(client, db_session, auth_headers):
    _create_objective(client, auth_headers, title='Objetivo 1', target_amount=100.0)
    _create_objective(client, auth_headers, title='Objetivo 2', target_amount=200.0)

    response = client.get('/objectives', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert len(data['data']) == 2
    titles = [obj['title'] for obj in data['data']]
    assert 'Objetivo 1' in titles
    assert 'Objetivo 2' in titles


# ============================================================
# PUT /objectives/:id
# ============================================================

def test_update_objective(client, db_session, auth_headers):
    create_resp = _create_objective(client, auth_headers, title='Antigo Titulo', target_amount=100.0)
    obj_id = create_resp.get_json()['data']['id']

    response = client.put(f'/objectives/{obj_id}', json={
        'title': 'Titulo Atualizado',
        'target_amount': 999.0
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['data']['title'] == 'Titulo Atualizado'
    assert float(data['data']['target_amount']) == 999.0


def test_update_objective_completion(client, db_session, auth_headers):
    create_resp = _create_objective(client, auth_headers, title='Meta Concluida', target_amount=500.0, current_amount=0.0)
    obj_id = create_resp.get_json()['data']['id']

    response = client.put(f'/objectives/{obj_id}', json={
        'current_amount': 500.0
    }, headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True
    assert data['data']['status'] == 'completed'


def test_update_objective_not_found(client, db_session, auth_headers):
    response = client.put('/objectives/999999', json={
        'title': 'Inexistente'
    }, headers=auth_headers)

    assert response.status_code == 404


# ============================================================
# DELETE /objectives/:id
# ============================================================

def test_delete_objective_success(client, db_session, auth_headers):
    create_resp = _create_objective(client, auth_headers, title='Para Deletar', target_amount=100.0)
    obj_id = create_resp.get_json()['data']['id']

    response = client.delete(f'/objectives/{obj_id}', headers=auth_headers)
    data = response.get_json()

    assert response.status_code == 200
    assert data['success'] is True

    get_resp = client.get('/objectives', headers=auth_headers)
    ids = [obj['id'] for obj in get_resp.get_json()['data']]
    assert obj_id not in ids


def test_delete_objective_not_found(client, db_session, auth_headers):
    response = client.delete('/objectives/999999', headers=auth_headers)
    assert response.status_code == 404
