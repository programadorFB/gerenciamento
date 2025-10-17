from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_cors import CORS
from flask_mail import Mail
import os
import logging
import sys

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)
    
    # IMPORTAÇÃO CORRIGIDA AQUI: from .config import config
    if config_name:
        from .config import config
        app.config.from_object(config[config_name])
    else:
        # Assumindo que você também tem a classe Config definida
        from .config import Config 
        app.config.from_object(Config) # Usando a classe base se não houver config_name
        # Configuração do Flask-Mail
        app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
        app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
        app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
        app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])
    # --- CONFIGURAÇÃO DE LOGGING ---
    if not app.debug:
        app.logger.handlers.clear()
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] in %(module)s: %(message)s'
        ))
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)
    # --- FIM DA CONFIGURAÇÃO DE LOGGING ---

    # Aplicar CORS após carregar config para pegar a origem certa
    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173","https://gerenciamento-1.onrender.com","https://gerenciamento.sortehub.online"])
    CORS(app, origins=origins, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    # Registro do Blueprint:
    from app.routes import main
    app.register_blueprint(main)

    # É melhor remover db.create_all() daqui e usar apenas o Flask-Migrate
    # No entanto, se quiser mantê-lo para inicialização rápida:
    # with app.app_context():
    #     from . import models
    #     db.create_all()
    
    return app