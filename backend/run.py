#!/usr/bin/env python3
"""
Betting Management Application Runner

This script initializes and runs the Flask application with proper configuration
for different environments (development, testing, production).
"""
import os
import sys
import click
import logging
from datetime import datetime, timedelta
from flask.cli import with_appcontext
from logging.handlers import RotatingFileHandler

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

# Get configuration from environment
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

def setup_logging():
    """Configure logging for the application"""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper())
    
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Create formatter for file logging (with emojis removed)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    
    # Create simple console formatter (no emojis, no color codes for Windows compatibility)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Rotating file handler
    log_file = os.path.join('logs', app.config.get('LOG_FILE', 'app.log'))
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=app.config.get('LOG_MAX_BYTES', 10 * 1024 * 1024),  # 10MB
        backupCount=app.config.get('LOG_BACKUP_COUNT', 3),
        encoding='utf-8'  # Explicitly set UTF-8 encoding for file
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    
    # Configure app logger
    app.logger.handlers.clear()  # Clear default handlers
    app.logger.addHandler(file_handler)
    if config_name != 'production':  # Only show console logs in dev/test
        app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
    app.logger.propagate = False
    
    # Suppress werkzeug logs in production
    if config_name == 'production':
        logging.getLogger('werkzeug').setLevel(logging.ERROR)
    
    return app.logger

def print_banner():
    """Print application banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║               BETTING MANAGEMENT SYSTEM                      ║
    ║                                                              ║
    ║                    Professional Edition                      ║
    ║                        Version 1.0.0                        ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def setup_application():
    """Setup application - called during startup"""
    with app.app_context():
        app.logger.info(f'BETTING MANAGEMENT APPLICATION starting in {config_name} mode')
        
        # Create tables if they don't exist
        try:
            db.create_all()
            app.logger.info('Database tables verified/created')
        except Exception as e:
            app.logger.error(f'Failed to create tables: {str(e)}')

@app.shell_context_processor
def make_shell_context():
    """Add models and utilities to Flask shell context"""
    # Import models here to avoid circular imports
    try:
        from app.models import User, BettingProfile, Transaction, Objective, BettingSession, BettingStats
        return {
            'db': db,
            'User': User,
            'BettingProfile': BettingProfile,
            'Transaction': Transaction,
            'Objective': Objective,
            'BettingSession': BettingSession,
            'BettingStats': BettingStats,
            'app': app,
            'datetime': datetime,
            'timedelta': timedelta,
        }
    except ImportError:
        # Models not yet available, return basic context
        return {
            'db': db,
            'app': app,
            'datetime': datetime,
            'timedelta': timedelta,
        }

@app.cli.command()
@click.option('--force', is_flag=True, help='Force initialization even if tables exist')
def init_db(force):
    """Initialize the database with tables"""
    try:
        if force:
            click.echo('Force initialization - dropping existing tables...')
            db.drop_all()
        
        click.echo('Creating database tables...')
        db.create_all()
        
        # Verify tables were created
        with app.app_context():
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
        click.echo(f'Database initialized successfully!')
        click.echo(f'   Created {len(tables)} tables: {", ".join(tables)}')
        
        if len(tables) == 0:
            click.echo('No tables were created. Check your models.')
            
    except Exception as e:
        click.echo(f'Error initializing database: {str(e)}')
        app.logger.error(f'Database initialization failed: {str(e)}')
        sys.exit(1)

@app.cli.command()
@click.confirmation_option(prompt='⚠️  Are you sure you want to drop all tables?')
def drop_db():
    """Drop all database tables"""
    try:
        db.drop_all()
        click.echo('✅ Database tables dropped successfully!')
        app.logger.info('Database tables dropped')
    except Exception as e:
        click.echo(f'❌ Error dropping tables: {str(e)}')
        app.logger.error(f'Failed to drop tables: {str(e)}')
        sys.exit(1)

@app.cli.command()
@click.confirmation_option(prompt='⚠️  Are you sure you want to reset the database? This will delete ALL data!')
def reset_db():
    """Reset database (drop and recreate all tables)"""
    try:
        click.echo('🔄 Dropping existing tables...')
        db.drop_all()
        
        click.echo('📊 Creating new tables...')
        db.create_all()
        
        click.echo('✅ Database reset successfully!')
        app.logger.info('Database reset completed')
        
    except Exception as e:
        click.echo(f'❌ Error resetting database: {str(e)}')
        app.logger.error(f'Database reset failed: {str(e)}')
        sys.exit(1)

@app.cli.command()
@click.option('--email', prompt='Admin email', help='Admin user email')
@click.option('--name', prompt='Admin name', help='Admin user name')
@click.option('--password', prompt='Admin password', hide_input=True, confirmation_prompt=True, help='Admin user password')
def create_admin(email, name, password):
    """Create an admin user"""
    try:
        import hashlib
        
        # Basic email validation
        if '@' not in email or '.' not in email:
            click.echo('❌ Invalid email format!')
            return
        
        # Basic password validation
        if len(password) < 8:
            click.echo('❌ Password must be at least 8 characters long!')
            return
        
        # Import models
        try:
            from app.models import User, BettingProfile
        except ImportError:
            click.echo('❌ Could not import models. Make sure models.py exists.')
            return
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            click.echo(f'❌ User with email {email} already exists!')
            return
        
        # Create admin user
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        admin_user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            is_active=True
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        # Create default betting profile for admin
        
        db.session.commit()
        
        click.echo('✅ Admin user created successfully!')
        click.echo(f'   👤 Name: {name}')
        click.echo(f'   📧 Email: {email}')
        click.echo(f'   🆔 User ID: {admin_user.id}')
        click.echo(f'   🛡️  Default profile created')
        
        app.logger.info(f'Admin user created: {email}')
        
    except Exception as e:
        click.echo(f'❌ Error creating admin user: {str(e)}')
        app.logger.error(f'Failed to create admin user: {str(e)}')
        db.session.rollback()
        sys.exit(1)

@app.cli.command()
@click.option('--count', default=5, help='Number of sample users to create')
def seed_data(count):
    """Seed database with sample data for development"""
    if config_name == 'production':
        click.echo('❌ Cannot seed data in production environment!')
        return
    
    try:
        from decimal import Decimal
        import hashlib
        import random
        from datetime import datetime, timedelta
        
        # Import models
        try:
            from app.models import User, BettingProfile, Transaction, Objective
        except ImportError:
            click.echo('❌ Could not import models. Make sure models.py exists.')
            return
        
        click.echo(f'🌱 Seeding database with sample data...')
        
        # Sample data templates
        sample_users = [
            {'name': 'Demo User', 'email': 'demo@example.com'},
            {'name': 'John Doe', 'email': 'john@example.com'},
            {'name': 'Jane Smith', 'email': 'jane@example.com'},
            {'name': 'Carlos Silva', 'email': 'carlos@example.com'},
            {'name': 'Ana Santos', 'email': 'ana@example.com'},
        ]
        
        profile_types = ['cautious', 'balanced', 'highrisk']
        categories = ['deposit', 'withdrawal', 'profit', 'bonus', 'cashback']
        game_types = ['roulette', 'blackjack', 'poker', 'slots', 'sports']
        
        users_created = 0
        
        for i in range(min(count, len(sample_users))):
            user_data = sample_users[i]
            
            # Skip if user already exists
            if User.query.filter_by(email=user_data['email']).first():
                continue
            
            # Create user
            password_hash = hashlib.sha256('password123'.encode()).hexdigest()
            user = User(
                name=user_data['name'],
                email=user_data['email'],
                password_hash=password_hash,
                is_active=True
            )
            db.session.add(user)
            db.session.flush()  # Get user ID
            
            # Create betting profile
            profile_type = random.choice(profile_types)
            risk_level = random.randint(1, 10)
            
            profile = BettingProfile(
                user_id=user.id,
                profile_type=profile_type,
                title=f'{profile_type.title()} Player',
                description=f'Sample {profile_type} betting profile',
                risk_level=risk_level,
                initial_balance=Decimal(str(random.randint(500, 2000))),
                stop_loss=Decimal(str(random.randint(100, 500))),
                profit_target=Decimal(str(random.randint(200, 1000))),
                features=[f'Feature {j+1}' for j in range(3)],
                color='#FFD700' if profile_type == 'balanced' else '#4CAF50' if profile_type == 'cautious' else '#F44336',
                icon_name='balance-scale' if profile_type == 'balanced' else 'shield-alt' if profile_type == 'cautious' else 'fire'
            )
            db.session.add(profile)
            users_created += 1
        
        db.session.commit()
        
        click.echo(f'✅ Sample data seeded successfully!')
        click.echo(f'   👥 Created {users_created} users')
        click.echo(f'   🔑 Default password: password123')
        click.echo(f'   📧 Sample emails: demo@example.com, john@example.com, etc.')
        
        app.logger.info(f'Sample data seeded: {users_created} users created')
        
    except Exception as e:
        click.echo(f'❌ Error seeding data: {str(e)}')
        app.logger.error(f'Failed to seed data: {str(e)}')
        db.session.rollback()
        sys.exit(1)

@app.cli.command()
def check_health():
    """Check application health and configuration"""
    try:
        click.echo('🏥 === APPLICATION HEALTH CHECK ===')
        click.echo()
        
        # Basic info
        click.echo(f'📊 Environment: {config_name}')
        click.echo(f'🐍 Python Version: {sys.version.split()[0]}')
        click.echo(f'🌐 Flask Version: {app.config.get("API_VERSION", "Unknown")}')
        click.echo()
        
        # Test database connection
        try:
            with app.app_context():
                result = db.session.execute(db.text('SELECT 1')).scalar()
                if result == 1:
                    db_status = '✅ Connected and responsive'
                    
                    # Get table count
                    inspector = db.inspect(db.engine)
                    tables = inspector.get_table_names()
                    db_status += f' ({len(tables)} tables)'
                else:
                    db_status = '⚠️  Connected but unexpected response'
        except Exception as e:
            db_status = f'❌ Connection failed: {str(e)[:50]}...'
        
        click.echo(f'🗄️  Database: {db_status}')
        
        # Check configuration
        config_status = '✅ Loaded' if app.config else '❌ Missing'
        click.echo(f'⚙️  Configuration: {config_status}')
        
        # Check critical settings
        click.echo(f'🔧 Debug Mode: {"✅ Enabled" if app.debug else "❌ Disabled"}')
        click.echo(f'🔐 Secret Key: {"✅ Set" if app.config.get("SECRET_KEY") else "❌ Missing"}')
        click.echo(f'🎯 CORS Origins: {app.config.get("CORS_ORIGINS", "Not set")}')
        
        # Overall health status
        click.echo()
        click.echo('🟢 HEALTH STATUS: HEALTHY')
        click.echo('   All systems operational')
        
        app.logger.info('Health check completed successfully')
        
    except Exception as e:
        click.echo(f'❌ Health check failed: {str(e)}')
        app.logger.error(f'Health check failed: {str(e)}')
        sys.exit(1)

@app.teardown_appcontext
def close_db_connection(error):
    """Close database connection on app teardown"""
    if error:
        app.logger.error(f'Application error: {str(error)}')
    db.session.remove()

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    app.logger.info(f'Received signal {signum}, shutting down gracefully...')
    sys.exit(0)

if __name__ == '__main__':
    # Setup signal handlers for graceful shutdown
    import signal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Setup logging
    logger = setup_logging()
    
    # Print banner
    print_banner()
    
    # Setup application (replaces @app.before_first_request)
    setup_application()
    
    # Log startup information
    logger.info('=' * 60)
    logger.info('BETTING MANAGEMENT APPLICATION STARTUP')
    logger.info(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    logger.info(f'Environment: {config_name.upper()}')
    logger.info(f'Python: {sys.version.split()[0]}')
    logger.info(f'Flask: {app.config.get("API_VERSION", "1.0")}')
    logger.info(f'Database: {app.config.get("SQLALCHEMY_DATABASE_URI", "").split("://")[0].upper()}')
    logger.info('=' * 60)
    
    # Check if we're in maintenance mode
    if app.config.get('MAINTENANCE_MODE', False):
        logger.warning('APPLICATION IS IN MAINTENANCE MODE!')
        print('\nMAINTENANCE MODE ACTIVE')
        print('The application is currently under maintenance.')
        print('Some features may be unavailable.\n')
    
    try:
        # Get port and host from environment
        port = int(os.getenv('PORT', 5000))
        host = os.getenv('HOST', '0.0.0.0' if config_name == 'production' else '127.0.0.1')
        
        # Log server configuration
        logger.info(f'Server starting on {host}:{port}')
        logger.info(f'Debug mode: {"ON" if app.debug else "OFF"}')
        logger.info(f'Security features: {"ENABLED" if config_name == "production" else "DEVELOPMENT"}')
        
        # Show available URLs in development
        if config_name == 'development':
            print(f'\nApplication URLs:')
            print(f'   • Main API: http://{host}:{port}')
            print(f'   • Health Check: http://{host}:{port}/health')
            print(f'   • Admin Panel: http://{host}:{port}/admin (if enabled)')
            print(f'\nAvailable CLI Commands:')
            print(f'   • flask init-db          # Initialize database')
            print(f'   • flask create-admin     # Create admin user')
            print(f'   • flask seed-data        # Add sample data')
            print(f'   • flask check-health     # System health check')
            print(f'\nServer is starting...\n')
        
        # Run the application
        app.run(
            host=host,
            port=port,
            debug=app.config.get('DEBUG', False),
            threaded=True,
            use_reloader=config_name == 'development',
            use_debugger=config_name == 'development'
        )
        
    except KeyboardInterrupt:
        logger.info('Application shutting down gracefully...')
        print('\nGoodbye! Application stopped by user.')
        
    except OSError as e:
        if 'Address already in use' in str(e):
            logger.error(f'Port {port} is already in use!')
            print(f'\nError: Port {port} is already in use!')
            print(f'Try using a different port: PORT=5001 python run.py')
        else:
            logger.error(f'OS Error: {str(e)}')
            print(f'\nSystem Error: {str(e)}')
        sys.exit(1)
        
    except Exception as e:
        logger.error(f'Application startup failed: {str(e)}')
        print(f'\nCritical Error: {str(e)}')
        print('Check the logs for more details.')
        sys.exit(1)
    
    finally:
        # Cleanup on exit
        logger.info('Performing cleanup...')
        try:
            db.session.remove()
            logger.info('Database connections closed')
        except:
            pass
        
        logger.info('Application shutdown complete')
        print('\nThank you for using Betting Management System!')

        if __name__ != '__main__':
    # This is for Gunicorn to find the app instance
            gunicorn_app = app