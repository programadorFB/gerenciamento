import pytest


def _start_session(client, headers, game_type='roulette', risk_level=5):
    return client.post('/betting-sessions', json={
        'game_type': game_type,
        'risk_level': risk_level,
        'meta': {}
    }, headers=headers)


# ============================================================
# POST /betting-sessions
# ============================================================

def test_start_session(client, db_session, auth_headers):
    response = _start_session(client, auth_headers, game_type='roulette')
    data = response.get_json()

    assert response.status_code == 201
    assert data['success'] is True
    assert 'session_id' in data
    assert data['session_id'] is not None
    assert 'start_balance' in data
    assert float(data['start_balance']) == 1000.0


# ============================================================
# POST /betting-sessions/:id/end
# ============================================================

def test_end_session(client, db_session, auth_headers):
    start_resp = _start_session(client, auth_headers, game_type='blackjack')
    start_data = start_resp.get_json()
    session_id = start_data['session_id']

    end_resp = client.post(f'/betting-sessions/{session_id}/end', headers=auth_headers)
    end_data = end_resp.get_json()

    assert end_resp.status_code == 200
    assert end_data['success'] is True
    assert end_data['data']['session_id'] == session_id
    assert 'start_balance' in end_data['data']
    assert 'end_balance' in end_data['data']
    assert 'net_result' in end_data['data']
    assert 'duration_seconds' in end_data['data']
    assert end_data['data']['duration_seconds'] >= 0


def test_end_session_not_found(client, db_session, auth_headers):
    fake_session_id = 'session-id-que-nao-existe-00000000'
    response = client.post(f'/betting-sessions/{fake_session_id}/end', headers=auth_headers)

    assert response.status_code == 404
