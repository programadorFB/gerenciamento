import os
from datetime import timedelta

class Config:
    # === DATABASE CONFIGURATION ===
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:1234@localhost/app-banca"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # === SECURITY CONFIGURATION ===
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    BCRYPT_LOG_ROUNDS = 13
    
    # === SESSION CONFIGURATION ===
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    
    # === CORS CONFIGURATION ===
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:19006').split(',')
    
    # === BETTING APP SPECIFIC CONFIGURATION ===
    
    # Default betting profile settings
    DEFAULT_INITIAL_BALANCE = float(os.getenv('DEFAULT_INITIAL_BALANCE', '1000.00'))
    DEFAULT_RISK_LEVEL = int(os.getenv('DEFAULT_RISK_LEVEL', '5'))
    
    # Risk management limits
    MAX_STOP_LOSS_PERCENTAGE = float(os.getenv('MAX_STOP_LOSS_PERCENTAGE', '50.0'))  # 50% max stop loss
    MAX_PROFIT_TARGET_PERCENTAGE = float(os.getenv('MAX_PROFIT_TARGET_PERCENTAGE', '500.0'))  # 500% max profit target
    MIN_BALANCE_AMOUNT = float(os.getenv('MIN_BALANCE_AMOUNT', '10.00'))  # Minimum balance
    MAX_TRANSACTION_AMOUNT = float(os.getenv('MAX_TRANSACTION_AMOUNT', '100000.00'))  # Maximum single transaction
    
    # Session management
    MAX_SESSION_DURATION_HOURS = int(os.getenv('MAX_SESSION_DURATION_HOURS', '24'))
    AUTO_END_SESSION_AFTER_HOURS = int(os.getenv('AUTO_END_SESSION_AFTER_HOURS', '12'))
    
    # Analytics and reporting
    ANALYTICS_RETENTION_DAYS = int(os.getenv('ANALYTICS_RETENTION_DAYS', '365'))  # Keep analytics for 1 year
    STATS_CALCULATION_PERIODS = ['daily', 'weekly', 'monthly', 'yearly']
    
    # Rate limiting
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
    RATE_LIMIT_REQUESTS_PER_HOUR = int(os.getenv('RATE_LIMIT_REQUESTS_PER_HOUR', '1000'))
    
    # File upload settings (for user avatars, etc.)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Email configuration (for notifications, password reset, etc.)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@bettingapp.com')
    
    # Notification settings
    ENABLE_EMAIL_NOTIFICATIONS = os.getenv('ENABLE_EMAIL_NOTIFICATIONS', 'True').lower() == 'true'
    ENABLE_STOP_LOSS_ALERTS = os.getenv('ENABLE_STOP_LOSS_ALERTS', 'True').lower() == 'true'
    ENABLE_PROFIT_TARGET_ALERTS = os.getenv('ENABLE_PROFIT_TARGET_ALERTS', 'True').lower() == 'true'
    ENABLE_SESSION_ALERTS = os.getenv('ENABLE_SESSION_ALERTS', 'True').lower() == 'true'
    
    # API versioning
    API_VERSION = os.getenv('API_VERSION', 'v1')
    API_TITLE = 'Betting Management API'
    API_DESCRIPTION = 'API for managing betting profiles, transactions, and analytics'
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', '10485760'))  # 10MB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', '3'))
    
    # Cache configuration (Redis)
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'redis')
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_DEFAULT_TIMEOUT', '300'))  # 5 minutes
    
    # Celery configuration (for background tasks)
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)
    CELERY_TIMEZONE = os.getenv('CELERY_TIMEZONE', 'UTC')
    
    # Feature flags
    ENABLE_ADVANCED_ANALYTICS = os.getenv('ENABLE_ADVANCED_ANALYTICS', 'True').lower() == 'true'
    ENABLE_SOCIAL_FEATURES = os.getenv('ENABLE_SOCIAL_FEATURES', 'False').lower() == 'true'
    ENABLE_EXPORT_FEATURES = os.getenv('ENABLE_EXPORT_FEATURES', 'True').lower() == 'true'
    ENABLE_BETTING_SESSIONS = os.getenv('ENABLE_BETTING_SESSIONS', 'True').lower() == 'true'
    
    # Game types configuration
    SUPPORTED_GAME_TYPES = [
        'roulette', 'blackjack', 'poker', 'slots', 
        'baccarat', 'sports', 'lottery', 'other'
    ]
    
    # Currency settings
    DEFAULT_CURRENCY = os.getenv('DEFAULT_CURRENCY', 'BRL')
    SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP']
    CURRENCY_PRECISION = int(os.getenv('CURRENCY_PRECISION', '2'))
    
    # Pagination defaults
    DEFAULT_PAGE_SIZE = int(os.getenv('DEFAULT_PAGE_SIZE', '20'))
    MAX_PAGE_SIZE = int(os.getenv('MAX_PAGE_SIZE', '100'))
    
    # Backup and maintenance
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'True').lower() == 'true'
    BACKUP_SCHEDULE = os.getenv('BACKUP_SCHEDULE', '0 2 * * *')  # Daily at 2 AM
    MAINTENANCE_MODE = os.getenv('MAINTENANCE_MODE', 'False').lower() == 'true'
    
    @staticmethod
    def init_app(app):
        """Initialize application with configuration"""
        pass

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    
    # More verbose logging in development
    LOG_LEVEL = 'DEBUG'
    
    # Disable some security features for development
    SESSION_COOKIE_SECURE = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)  # Shorter token expiry for testing
    
    # Enable all features in development
    ENABLE_ADVANCED_ANALYTICS = True
    ENABLE_SOCIAL_FEATURES = True
    ENABLE_EXPORT_FEATURES = True
    ENABLE_BETTING_SESSIONS = True
    
    # Development database (SQLite for easy setup)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DEV_DATABASE_URL',
        'sqlite:///betting_app_dev.db'
    )

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable external services during testing
    ENABLE_EMAIL_NOTIFICATIONS = False
    RATE_LIMIT_ENABLED = False
    
    # Faster password hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    # Short token expiry for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    
    # Disable cache during testing
    CACHE_TYPE = 'null'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Stricter security in production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Enable rate limiting in production
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_REQUESTS_PER_HOUR = 500  # Lower limit in production
    
    # More secure password hashing
    BCRYPT_LOG_ROUNDS = 15
    
    # Enable all production features
    ENABLE_EMAIL_NOTIFICATIONS = True
    ENABLE_STOP_LOSS_ALERTS = True
    ENABLE_PROFIT_TARGET_ALERTS = True
    BACKUP_ENABLED = True
    
    # Production logging
    LOG_LEVEL = 'INFO'
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        Config.init_app(app)
        
        # Log to syslog in production
        import logging
        from logging.handlers import SysLogHandler
        
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.INFO)
        app.logger.addHandler(syslog_handler)

class HerokuConfig(ProductionConfig):
    """Heroku-specific configuration"""
    
    @classmethod
    def init_app(cls, app):
        """Heroku-specific initialization"""
        ProductionConfig.init_app(app)
        
        # Handle Heroku's SSL termination
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app)
        
        # Log to stdout on Heroku
        import logging
        import sys
        
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'heroku': HerokuConfig,
    'default': DevelopmentConfig
}

# Risk management constants
RISK_LEVELS = {
    'conservative': {
        'range': (1, 3),
        'max_stop_loss_percentage': 10,
        'max_profit_target_percentage': 25,
        'recommended_max_bet_percentage': 2
    },
    'moderate': {
        'range': (4, 6),
        'max_stop_loss_percentage': 20,
        'max_profit_target_percentage': 50,
        'recommended_max_bet_percentage': 5
    },
    'aggressive': {
        'range': (7, 10),
        'max_stop_loss_percentage': 40,
        'max_profit_target_percentage': 100,
        'recommended_max_bet_percentage': 10
    }
}

# Game type configurations
GAME_CONFIGURATIONS = {
    'roulette': {
        'name': 'Roleta',
        'icon': 'casino',
        'house_edge': 2.7,  # European roulette
        'volatility': 'high',
        'min_bet_multiplier': 0.01,
        'max_bet_multiplier': 0.1
    },
    'blackjack': {
        'name': 'Blackjack',
        'icon': 'spade',
        'house_edge': 0.5,  # With basic strategy
        'volatility': 'medium',
        'min_bet_multiplier': 0.02,
        'max_bet_multiplier': 0.15
    },
    'poker': {
        'name': 'Poker',
        'icon': 'diamond',
        'house_edge': 5.0,  # Rake
        'volatility': 'very_high',
        'min_bet_multiplier': 0.05,
        'max_bet_multiplier': 0.25
    },
    'slots': {
        'name': 'Caça-níqueis',
        'icon': 'slot-machine',
        'house_edge': 5.0,
        'volatility': 'very_high',
        'min_bet_multiplier': 0.01,
        'max_bet_multiplier': 0.05
    },
    'sports': {
        'name': 'Apostas Esportivas',
        'icon': 'sports-soccer',
        'house_edge': 4.5,  # Bookmaker margin
        'volatility': 'high',
        'min_bet_multiplier': 0.02,
        'max_bet_multiplier': 0.2
    }
}

# API response templates
API_RESPONSES = {
    'SUCCESS': {
        'success': True,
        'message': 'Operation completed successfully'
    },
    'ERROR': {
        'success': False,
        'message': 'An error occurred'
    },
    'VALIDATION_ERROR': {
        'success': False,
        'message': 'Validation failed',
        'errors': []
    },
    'UNAUTHORIZED': {
        'success': False,
        'message': 'Authentication required'
    },
    'FORBIDDEN': {
        'success': False,
        'message': 'Insufficient permissions'
    },
    'NOT_FOUND': {
        'success': False,
        'message': 'Resource not found'
    }
}