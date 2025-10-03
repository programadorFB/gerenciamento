from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)
    
    if config_name:
        from .config import config
        app.config.from_object(config[config_name])
    else:
        app.config.from_object('app.config.Config')

    # Aplicar CORS após carregar config para pegar a origem certa
    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    CORS(app, origins=origins, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes import main
    app.register_blueprint(main)

    return app
