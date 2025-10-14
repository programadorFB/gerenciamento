import pytz
from . import db
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from decimal import Decimal

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_photo = db.Column(db.String(500), nullable=True)
    
    # Relationships
    betting_profiles = db.relationship('BettingProfile', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    objectives = db.relationship('Objective', backref='user', lazy=True, cascade='all, delete-orphan')

class BettingProfile(db.Model):
    __tablename__ = 'betting_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Profile Information
    profile_type = db.Column(db.String(20), nullable=False)  # cautious, balanced, highrisk
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    risk_level = db.Column(db.Integer, nullable=False)  # 0-10
    
    # Financial Settings
    initial_balance = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal('1000.00'))
    stop_loss = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # --- LINHA ADICIONADA ---
    stop_loss_percentage = db.Column(db.Numeric(10, 2), nullable=True, default=0)
    
    profit_target = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # Profile Configuration
    features = db.Column(JSON)  # Array of features
    color = db.Column(db.String(7), default='#FFD700')  # Hex color
    icon_name = db.Column(db.String(50), default='dice')
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Transaction Details
    type = db.Column(db.String(20), nullable=False)  # deposit / withdraw
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    category = db.Column(db.String(50)) 
    description = db.Column(db.Text)
    
    # Betting Specific
    is_initial_bank = db.Column(db.Boolean, default=False)
    betting_session_id = db.Column(db.String(50))  # To group related bets
    game_type = db.Column(db.String(30))  # roulette, blackjack, etc
    
    # Balance Tracking
    balance_before = db.Column(db.Numeric(12, 2))
    balance_after = db.Column(db.Numeric(12, 2))
    
    # Metadata
    meta = db.Column(JSON)  # Additional data like bet details, odds, etc
    tags = db.Column(JSON)  # Array of tags for categorization
    
    # Timestamps
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for better performance
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'date'),
        db.Index('idx_user_type', 'user_id', 'type'),
        db.Index('idx_user_category', 'user_id', 'category'),
    )

class Objective(db.Model):
    __tablename__ = 'objectives'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Objective Details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    current_amount = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # Timeline
    target_date = db.Column(db.Date)
    priority = db.Column(db.String(10), default='medium')  # low, medium, high
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, completed, paused, cancelled
    is_achieved = db.Column(db.Boolean, default=False)
    achievement_date = db.Column(db.DateTime)
    
    # Configuration
    category = db.Column(db.String(50))  # withdrawal, equipment, vacation, etc
    color = db.Column(db.String(7), default='#FFD700')
    icon_name = db.Column(db.String(50), default='flag')
    
    # Metadata
    meta = db.Column(JSON)  # Additional configuration
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BettingSession(db.Model):
    __tablename__ = 'betting_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(50), unique=True, nullable=False)
    
    # Session Details
    game_type = db.Column(db.String(30), nullable=False)  # roulette, blackjack, etc
    start_balance = db.Column(db.Numeric(12, 2), nullable=False)
    end_balance = db.Column(db.Numeric(12, 2))
    
    # Session Statistics
    total_bets = db.Column(db.Integer, default=0)
    winning_bets = db.Column(db.Integer, default=0)
    losing_bets = db.Column(db.Integer, default=0)
    total_wagered = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    net_result = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # Session Timeline
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer)  # Calculated duration
    
    # Session Configuration
    risk_level = db.Column(db.Integer)  # Risk level used in this session
    stop_loss_hit = db.Column(db.Boolean, default=False)
    profit_target_hit = db.Column(db.Boolean, default=False)
    
    # Metadata
    meta = db.Column(JSON)  # Strategy used, notes, etc
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, completed, stopped
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BettingStats(db.Model):
    __tablename__ = 'betting_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Time Period
    period_type = db.Column(db.String(10), nullable=False)  # daily, weekly, monthly, yearly
    period_date = db.Column(db.Date, nullable=False)
    
    # Financial Stats
    starting_balance = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    ending_balance = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    total_deposits = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    total_withdrawals = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    net_profit_loss = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # Betting Stats
    total_sessions = db.Column(db.Integer, default=0)
    winning_sessions = db.Column(db.Integer, default=0)
    losing_sessions = db.Column(db.Integer, default=0)
    total_bets = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Numeric(5, 2), default=Decimal('0.00'))  # Percentage
    
    # Risk Management
    stop_losses_hit = db.Column(db.Integer, default=0)
    profit_targets_hit = db.Column(db.Integer, default=0)
    max_drawdown = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    max_profit = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    
    # Metadata
    meta = db.Column(JSON)  # Additional calculated metrics
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('America/Sao_Paulo')))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('America/Sao_Paulo')))
    # Unique constraint to prevent duplicate stats
    __table_args__ = (
        db.UniqueConstraint('user_id', 'period_type', 'period_date', name='unique_user_period_stats'),
        db.Index('idx_user_period', 'user_id', 'period_type', 'period_date'),
    )