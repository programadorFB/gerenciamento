import os

os.environ['TEST_DATABASE_URL'] = 'postgresql://postgres:1234@localhost:5432/betting_tracker_test'
os.environ['FLASK_ENV'] = 'testing'

import pytest
from app import create_app, db as _db


@pytest.fixture(scope='session')
def app():
    flask_app = create_app('testing')

    with flask_app.app_context():
        _db.create_all()

    yield flask_app

    with flask_app.app_context():
        _db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        _db.session.execute(_db.text('DELETE FROM betting_stats'))
        _db.session.execute(_db.text('DELETE FROM betting_sessions'))
        _db.session.execute(_db.text('DELETE FROM transactions'))
        _db.session.execute(_db.text('DELETE FROM betting_profiles'))
        _db.session.execute(_db.text('DELETE FROM objectives'))
        _db.session.execute(_db.text('DELETE FROM users'))
        _db.session.commit()

    yield _db


@pytest.fixture(scope='function')
def auth_headers(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'senha123',
        'initialBank': 1000.0
    })
    data = response.get_json()
    token = data['token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='function')
def registered_user(client, db_session):
    response = client.post('/auth/register', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'senha123',
        'initialBank': 1000.0
    })
    data = response.get_json()
    return {
        'id': data['user']['id'],
        'name': data['user']['name'],
        'email': 'test@example.com',
        'password': 'senha123',
        'token': data['token']
    }
