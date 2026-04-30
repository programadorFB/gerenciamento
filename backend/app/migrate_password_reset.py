#!/usr/bin/env python3
"""
Script de migração para adicionar campos de reset de senha na tabela `users`.

Adiciona as colunas:
    - reset_token (VARCHAR(128))
    - reset_token_expires (TIMESTAMP)

E cria índice em reset_token para lookup rápido.

Usage:
    python migrate_password_reset.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost/betting_tracker')


def main():
    print("Iniciando migração: campos de reset de senha")
    print("=" * 60)

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP",
            "CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token)",
        ]

        for stmt in statements:
            print(f"  -> {stmt}")
            session.execute(text(stmt))

        session.commit()
        print("Migração concluída com sucesso.")
        return True

    except Exception as e:
        session.rollback()
        print(f"Erro na migração: {e}")
        return False

    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
