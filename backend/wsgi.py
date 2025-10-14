# wsgi.py
import os

# Importação corrigida para usar o caminho relativo, assumindo que wsgi.py 
# e a pasta 'app' estão no mesmo nível dentro do pacote 'backend'.
# Isso resolve o erro 'ModuleNotFoundError: No module named 'app''
from .app import create_app

# A Render vai configurar a variável de ambiente, mas 'production' é um padrão seguro.
config_name = os.getenv('FLASK_ENV', 'production')

# Criamos a instância da aplicação que o Gunicorn vai usar.
# Note que a variável aqui deve ser 'application' para ser reconhecida pelo Gunicorn
application = create_app(config_name)
