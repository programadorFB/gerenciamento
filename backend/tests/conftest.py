"""
Fixtures compartilhadas para todos os testes do backend.
Usa SQLite em memória para velocidade — sem dependência de Postgres para rodar testes unitários.
"""
import os
import sys
import pytest
from decimal import Decimal
from datetime import datetime

# Garantir que o pacote backend está no path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Overrides de ambiente ANTES de importar a app
os.environ['FLASK_ENV'] = 'testing'
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['TEST_DATABASE_URL'] = 'sqlite://'


@pytest.fixture(scope='session')
def app():
    """Cria a aplicação Flask configurada para testes."""
    from app.config import TestingConfig
    # Patch ANTES de criar a app: SQLite não suporta pool_size/max_overflow/pool_timeout
    TestingConfig.SQLALCHEMY_DATABASE_URI = 'sqlite://'
    TestingConfig.SQLALCHEMY_ENGINE_OPTIONS = {}

    from app import create_app
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret-key'
    yield app


@pytest.fixture(scope='function')
def db(app):
    """Cria as tabelas antes de cada teste e dropa depois."""
    from app import db as _db
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture
def client(app, db):
    """Cliente de teste HTTP."""
    return app.test_client()


@pytest.fixture
def runner(app, db):
    """CLI runner para testes de comandos Flask."""
    return app.test_cli_runner()


# ── Helpers ──────────────────────────────────────────────────────────

import hashlib

def _make_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@pytest.fixture
def sample_user(db):
    """Cria um usuário de teste no banco."""
    from app.models import User
    user = User(
        name='Teste User',
        email='teste@email.com',
        password_hash=_make_password_hash('Senha123!'),
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def sample_user_with_bank(db, sample_user):
    """Usuário com transação de banca inicial + perfil de apostas."""
    from app.models import Transaction, BettingProfile
    tx = Transaction(
        user_id=sample_user.id,
        type='deposit',
        amount=Decimal('1000.00'),
        category='Depósito Inicial',
        description='Banca inicial',
        is_initial_bank=True,
        balance_before=Decimal('0.00'),
        balance_after=Decimal('1000.00'),
        date=datetime.utcnow(),
    )
    profile = BettingProfile(
        user_id=sample_user.id,
        profile_type='balanced',
        title='Perfil Padrão',
        description='Perfil de teste',
        risk_level=5,
        initial_balance=Decimal('1000.00'),
        stop_loss=Decimal('500.00'),
        stop_loss_percentage=Decimal('50.00'),
        profit_target=Decimal('2000.00'),
        is_active=True,
    )
    db.session.add_all([tx, profile])
    db.session.commit()
    return sample_user


@pytest.fixture
def auth_headers(client, sample_user):
    """Headers com token JWT válido."""
    resp = client.post('/auth/login', json={
        'email': 'teste@email.com',
        'password': 'Senha123!',
    })
    token = resp.get_json()['token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def auth_headers_with_bank(client, sample_user_with_bank):
    """Headers com token JWT para usuário que já tem banca."""
    resp = client.post('/auth/login', json={
        'email': 'teste@email.com',
        'password': 'Senha123!',
    })
    token = resp.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
