# backend/app/__init__.py
import logging
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config

db = SQLAlchemy()

def create_app(config_name='default'):
    app = Flask(__name__)
    
    app_config = config.get(config_name)
    app.config.from_object(app_config)
    
    # --- CONFIGURAÇÃO DE LOGGING DEFINITIVA PARA A RENDER ---
    # Isto força todos os logs, especialmente os erros, a aparecerem na consola da Render.
    if not app.debug:
        app.logger.handlers.clear()
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] in %(module)s: %(message)s'
        ))
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)
    # --- FIM DA CONFIGURAÇÃO DE LOGGING ---

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": app.config.get('CORS_ORIGINS', '*')}})

    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint, url_prefix='/')

    with app.app_context():
        from . import models
        db.create_all()
        app.logger.info("Tabelas do banco de dados verificadas/criadas.")

    return app

