# backend/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config

# Inicializa as extensões para serem importadas por outros arquivos
db = SQLAlchemy()

def create_app(config_name='default'):
    """
    Esta é a 'App Factory'. Ela cria e configura a aplicação Flask.
    """
    app = Flask(__name__)
    
    # Carrega as configurações do arquivo config.py
    app_config = config.get(config_name)
    if app_config is None:
        raise ValueError(f"Config '{config_name}' not found.")
    app.config.from_object(app_config)
    
    # Inicializa as extensões com a instância da aplicação
    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": app.config.get('CORS_ORIGINS', '*')}})

    # Registra o Blueprint que contém todas as suas rotas
    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint, url_prefix='/')

    # ====================================================================
    # A SOLUÇÃO CORRIGIDA
    # ====================================================================
    # Agora que as rotas e modelos já foram carregados, o SQLAlchemy
    # sabe quais tabelas precisam ser criadas.
    with app.app_context():
        # Importamos os modelos aqui para ter certeza de que eles são conhecidos
        # antes de chamar db.create_all()
        from . import models
        db.create_all()
    # ====================================================================

    return app
