from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from dotenv import load_dotenv
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()

def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)

    if config_name:
        from .config import config
        app.config.from_object(config[config_name])
    else:
        app.config.from_object('app.config.Config')

    # Configuração do Flask-Mail (todos os ambientes)
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME'))

    # Aplicar CORS após carregar config para pegar a origem certa
    origins = list(app.config.get("CORS_ORIGINS", ["http://localhost:5173","https://gerenciamento-1.onrender.com/"]))
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url and frontend_url not in origins:
        origins.append(frontend_url)
    CORS(app, origins=origins, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    from .routes import main
    app.register_blueprint(main)

    return app
