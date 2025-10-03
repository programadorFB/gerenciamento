# wsgi.py
import os
# Importamos a factory 'create_app' diretamente do seu pacote da aplicação.
# Assumindo que seu pacote principal se chama 'app'. Se for outro nome, ajuste aqui.
from app import create_app

# A Render vai configurar a variável de ambiente, mas 'production' é um padrão seguro.
config_name = os.getenv('FLASK_ENV', 'production')

# Criamos a instância da aplicação que o Gunicorn vai usar.
app = create_app(config_name)
