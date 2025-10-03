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

    # ====================================================================
    # A SOLUÇÃO MÁGICA ESTÁ AQUI
    # ====================================================================
    # Este bloco de código é executado quando a aplicação inicia.
    # Ele cria todas as tabelas definidas em models.py se elas
    # ainda não existirem no banco de dados.
    # Isso elimina a necessidade de rodar "flask init-db" manualmente.
    with app.app_context():
        db.create_all()
    # ====================================================================

    # Registra o Blueprint que contém todas as suas rotas
    from .app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint, url_prefix='/')

    return app