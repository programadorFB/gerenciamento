from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging
import sys

db = SQLAlchemy()
migrate = Migrate()

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
    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    CORS(app, origins=origins, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    # Registro do Blueprint:
    from .routes import main
    app.register_blueprint(main)

    # É melhor remover db.create_all() daqui e usar apenas o Flask-Migrate
    # No entanto, se quiser mantê-lo para inicialização rápida:
    # with app.app_context():
    #     from . import models
    #     db.create_all()

    return app
