"""Testes unitários dos modelos SQLAlchemy."""
import pytest
from decimal import Decimal
from datetime import datetime
from app.models import User, Transaction, BettingProfile, Objective, BettingSession


class TestUserModel:

    def test_create_user(self, db):
        user = User(name='Modelo', email='modelo@test.com', password_hash='hash123')
        db.session.add(user)
        db.session.commit()
        assert user.id is not None
        assert user.is_active is True
        assert user.created_at is not None

    def test_email_unique(self, db, sample_user):
        dup = User(name='Dup', email='teste@email.com', password_hash='hash')
        db.session.add(dup)
        with pytest.raises(Exception):
            db.session.commit()

    def test_cascade_delete(self, db, sample_user_with_bank):
        user_id = sample_user_with_bank.id
        db.session.delete(sample_user_with_bank)
        db.session.commit()
        assert Transaction.query.filter_by(user_id=user_id).count() == 0
        assert BettingProfile.query.filter_by(user_id=user_id).count() == 0


class TestTransactionModel:

    def test_create_transaction(self, db, sample_user):
        tx = Transaction(
            user_id=sample_user.id,
            type='deposit',
            amount=Decimal('500.00'),
            date=datetime.utcnow(),
        )
        db.session.add(tx)
        db.session.commit()
        assert tx.id is not None
        assert tx.is_initial_bank is False

    def test_initial_bank_flag(self, db, sample_user):
        tx = Transaction(
            user_id=sample_user.id,
            type='deposit',
            amount=Decimal('1000.00'),
            is_initial_bank=True,
            date=datetime.utcnow(),
        )
        db.session.add(tx)
        db.session.commit()
        assert tx.is_initial_bank is True

    def test_decimal_precision(self, db, sample_user):
        tx = Transaction(
            user_id=sample_user.id,
            type='gains',
            amount=Decimal('123.45'),
            date=datetime.utcnow(),
        )
        db.session.add(tx)
        db.session.commit()
        loaded = Transaction.query.get(tx.id)
        assert loaded.amount == Decimal('123.45')


class TestBettingProfileModel:

    def test_create_profile(self, db, sample_user):
        profile = BettingProfile(
            user_id=sample_user.id,
            profile_type='cautious',
            title='Cauteloso',
            risk_level=3,
            initial_balance=Decimal('500.00'),
        )
        db.session.add(profile)
        db.session.commit()
        assert profile.id is not None
        assert profile.is_active is True

    def test_default_values(self, db, sample_user):
        profile = BettingProfile(
            user_id=sample_user.id,
            profile_type='balanced',
            title='Test',
            risk_level=5,
            initial_balance=Decimal('1000.00'),
        )
        db.session.add(profile)
        db.session.commit()
        assert profile.color == '#2f00ffff'
        assert profile.icon_name == 'dice'


class TestObjectiveModel:

    def test_create_objective(self, db, sample_user):
        obj = Objective(
            user_id=sample_user.id,
            title='Meta Teste',
            target_amount=Decimal('5000.00'),
        )
        db.session.add(obj)
        db.session.commit()
        assert obj.status == 'active'
        assert obj.is_achieved is False

    def test_default_priority(self, db, sample_user):
        obj = Objective(
            user_id=sample_user.id,
            title='Test',
            target_amount=Decimal('100.00'),
        )
        db.session.add(obj)
        db.session.commit()
        assert obj.priority == 'medium'
