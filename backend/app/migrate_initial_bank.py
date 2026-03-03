#!/usr/bin/env python3
"""
Script de migração para implementar banca inicial obrigatória
Execute este script após atualizar o código e aplicar as migrações SQL

Usage:
    python migrate_initial_bank.py
"""

import os
import sys
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuração do banco de dados
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost/betting_tracker')

def get_db_connection():
    """Criar conexão com o banco de dados"""
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        return engine, Session()
    except Exception as e:
        print(f"❌ Erro ao conectar com o banco: {e}")
        sys.exit(1)

def check_database_structure(session):
    """Verificar se a estrutura do banco está correta"""
    print("🔍 Verificando estrutura do banco de dados...")
    
    try:
        # Verificar se a coluna is_initial_bank existe
        result = session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'is_initial_bank'
        """)).fetchone()
        
        if not result:
            print("❌ Coluna 'is_initial_bank' não encontrada na tabela 'transactions'")
            print("   Execute primeiro as migrações SQL!")
            return False
        
        print("✅ Estrutura do banco verificada")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar estrutura: {e}")
        return False

def analyze_current_data(session):
    """Analisar dados atuais e identificar problemas"""
    print("\n📊 Analisando dados atuais...")
    
    try:
        # Contar usuários totais
        total_users = session.execute(text("SELECT COUNT(*) FROM users WHERE is_active = TRUE")).scalar()
        
        # Usuários com banca inicial
        users_with_initial_bank = session.execute(text("""
            SELECT COUNT(DISTINCT user_id) 
            FROM transactions 
            WHERE is_initial_bank = TRUE
        """)).scalar()
        
        # Usuários sem banca inicial
        users_without_initial_bank = total_users - users_with_initial_bank
        
        # Transações de depósito que podem ser convertidas
        convertible_deposits = session.execute(text("""
            SELECT COUNT(*) 
            FROM transactions t1
            WHERE t1.type = 'deposit'
            AND NOT EXISTS (
                SELECT 1 FROM transactions t2 
                WHERE t2.user_id = t1.user_id 
                AND t2.is_initial_bank = TRUE
            )
        """)).scalar()
        
        print(f"   Total de usuários ativos: {total_users}")
        print(f"   Usuários com banca inicial: {users_with_initial_bank}")
        print(f"   Usuários SEM banca inicial: {users_without_initial_bank}")
        print(f"   Depósitos conversíveis: {convertible_deposits}")
        
        return {
            'total_users': total_users,
            'users_with_initial_bank': users_with_initial_bank,
            'users_without_initial_bank': users_without_initial_bank,
            'convertible_deposits': convertible_deposits
        }
        
    except Exception as e:
        print(f"❌ Erro ao analisar dados: {e}")
        return None

def migrate_existing_users(session):
    """Migrar usuários existentes sem banca inicial"""
    print("\n🔄 Migrando usuários existentes...")
    
    try:
        # Buscar usuários sem banca inicial
        users_without_initial = session.execute(text("""
            SELECT DISTINCT u.id, u.name, u.email
            FROM users u
            WHERE u.is_active = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM transactions t 
                WHERE t.user_id = u.id 
                AND t.is_initial_bank = TRUE
            )
        """)).fetchall()
        
        if not users_without_initial:
            print("✅ Todos os usuários já possuem banca inicial")
            return True
        
        migrated_count = 0
        
        for user in users_without_initial:
            user_id, name, email = user
            
            # Buscar primeira transação de depósito
            first_deposit = session.execute(text("""
                SELECT id, amount, date, description
                FROM transactions
                WHERE user_id = :user_id 
                AND type = 'deposit'
                ORDER BY date ASC
                LIMIT 1
            """), {'user_id': user_id}).fetchone()
            
            if first_deposit:
                # Marcar como banca inicial
                session.execute(text("""
                    UPDATE transactions 
                    SET is_initial_bank = TRUE,
                        description = COALESCE(description, '') || ' (Convertido para banca inicial)',
                        meta = COALESCE(meta, '{}')::jsonb || :meta::jsonb
                    WHERE id = :transaction_id
                """), {
                    'transaction_id': first_deposit[0],
                    'meta': f'{{"converted_to_initial_bank": true, "conversion_date": "{datetime.utcnow().isoformat()}"}}'
                })
                
                print(f"   ✅ {name} ({email}): R$ {first_deposit[1]} convertido para banca inicial")
                migrated_count += 1
                
            else:
                # Usuário sem nenhuma transação - criar banca inicial padrão
                default_amount = Decimal('100.00')
                
                session.execute(text("""
                    INSERT INTO transactions (
                        user_id, type, amount, category, description, 
                        is_initial_bank, balance_before, balance_after, 
                        meta, date, created_at
                    ) VALUES (
                        :user_id, 'deposit', :amount, 'Depósito Inicial', 
                        'Banca inicial criada automaticamente na migração',
                        TRUE, 0.00, :amount,
                        :meta, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                """), {
                    'user_id': user_id,
                    'amount': default_amount,
                    'meta': f'{{"created_on_migration": true, "migration_date": "{datetime.utcnow().isoformat()}"}}'
                })
                
                print(f"   ⚠️  {name} ({email}): Banca inicial padrão criada (R$ {default_amount})")
                migrated_count += 1
        
        session.commit()
        print(f"\n✅ {migrated_count} usuários migrados com sucesso")
        return True
        
    except Exception as e:
        session.rollback()
        print(f"❌ Erro na migração: {e}")
        return False

def update_betting_profiles(session):
    """Atualizar perfis de apostas com a banca inicial correta"""
    print("\n🎯 Atualizando perfis de apostas...")
    
    try:
        # Atualizar perfis com banca inicial real
        updated = session.execute(text("""
            UPDATE betting_profiles 
            SET initial_balance = (
                SELECT amount 
                FROM transactions 
                WHERE user_id = betting_profiles.user_id 
                AND is_initial_bank = TRUE 
                LIMIT 1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE initial_balance = 0 
            OR initial_balance IS NULL
            OR initial_balance != (
                SELECT COALESCE(amount, 0) 
                FROM transactions 
                WHERE user_id = betting_profiles.user_id 
                AND is_initial_bank = TRUE 
                LIMIT 1
            )
        """)).rowcount
        
        session.commit()
        print(f"✅ {updated} perfis de apostas atualizados")
        return True
        
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao atualizar perfis: {e}")
        return False

def create_missing_profiles(session):
    """Criar perfis de apostas para usuários que não possuem"""
    print("\n👤 Criando perfis de apostas faltantes...")
    
    try:
        # Buscar usuários sem perfil ativo
        users_without_profile = session.execute(text("""
            SELECT u.id, u.name, t.amount as initial_bank
            FROM users u
            INNER JOIN transactions t ON u.id = t.user_id AND t.is_initial_bank = TRUE
            WHERE u.is_active = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM betting_profiles bp 
                WHERE bp.user_id = u.id AND bp.is_active = TRUE
            )
        """)).fetchall()
        
        created_count = 0
        
        for user in users_without_profile:
            user_id, name, initial_bank = user
            
            # Criar perfil padrão
            session.execute(text("""
                INSERT INTO betting_profiles (
                    user_id, profile_type, title, description, risk_level,
                    initial_balance, stop_loss, profit_target, features,
                    color, icon_name, is_active, created_at, updated_at
                ) VALUES (
                    :user_id, 'balanced', 'Perfil Padrão', 
                    'Perfil criado automaticamente na migração', 5,
                    :initial_balance, :stop_loss, :profit_target, 
                    :features, '#2f00ffff', 'dice', TRUE, 
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            """), {
                'user_id': user_id,
                'initial_balance': initial_bank,
                'stop_loss': initial_bank * Decimal('0.5'),  # 50% stop loss
                'profit_target': initial_bank * Decimal('0.3'),  # 30% profit target
                'features': '["bankroll_management", "session_tracking"]'
            })
            
            created_count += 1
            print(f"   ✅ Perfil criado para {name} (Banca: R$ {initial_bank})")
        
        session.commit()
        print(f"\n✅ {created_count} perfis de apostas criados")
        return True
        
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao criar perfis: {e}")
        return False

def validate_migration(session):
    """Validar se a migração foi bem-sucedida"""
    print("\n✅ Validando migração...")
    
    try:
        # Verificações finais
        checks = {
            'Usuários com banca inicial': """
                SELECT COUNT(*) FROM users u
                WHERE u.is_active = TRUE
                AND EXISTS (
                    SELECT 1 FROM transactions t 
                    WHERE t.user_id = u.id AND t.is_initial_bank = TRUE
                )
            """,
            'Usuários SEM banca inicial': """
                SELECT COUNT(*) FROM users u
                WHERE u.is_active = TRUE
                AND NOT EXISTS (
                    SELECT 1 FROM transactions t 
                    WHERE t.user_id = u.id AND t.is_initial_bank = TRUE
                )
            """,
            'Usuários com perfil ativo': """
                SELECT COUNT(*) FROM users u
                WHERE u.is_active = TRUE
                AND EXISTS (
                    SELECT 1 FROM betting_profiles bp 
                    WHERE bp.user_id = u.id AND bp.is_active = TRUE
                )
            """,
            'Transações de banca inicial': """
                SELECT COUNT(*) FROM transactions WHERE is_initial_bank = TRUE
            """
        }
        
        all_passed = True
        
        for check_name, query in checks.items():
            result = session.execute(text(query)).scalar()
            print(f"   {check_name}: {result}")
            
            # Verificar se há problemas
            if check_name == 'Usuários SEM banca inicial' and result > 0:
                print(f"   ⚠️  ATENÇÃO: {result} usuários ainda sem banca inicial!")
                all_passed = False
        
        if all_passed:
            print("\n🎉 Migração concluída com sucesso!")
            print("   Todos os usuários agora possuem banca inicial obrigatória")
        else:
            print("\n⚠️  Migração concluída com avisos - revisar usuários problemáticos")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Erro na validação: {e}")
        return False

def main():
    """Função principal da migração"""
    print("🚀 Iniciando migração para banca inicial obrigatória")
    print("=" * 60)
    
    # Conectar ao banco
    engine, session = get_db_connection()
    
    try:
        # 1. Verificar estrutura
        if not check_database_structure(session):
            return False
        
        # 2. Analisar dados atuais
        analysis = analyze_current_data(session)
        if not analysis:
            return False
        
        # Se todos já têm banca inicial, não precisa migrar
        if analysis['users_without_initial_bank'] == 0:
            print("\n✅ Todos os usuários já possuem banca inicial!")
            return validate_migration(session)
        
        # 3. Confirmar migração
        print(f"\n⚠️  ATENÇÃO: {analysis['users_without_initial_bank']} usuários serão migrados")
        confirm = input("Deseja continuar? (s/N): ").lower().strip()
        
        if confirm != 's':
            print("❌ Migração cancelada pelo usuário")
            return False
        
        # 4. Executar migração
        if not migrate_existing_users(session):
            return False
        
        # 5. Atualizar perfis
        if not update_betting_profiles(session):
            return False
        
        # 6. Criar perfis faltantes
        if not create_missing_profiles(session):
            return False
        
        # 7. Validar resultado
        return validate_migration(session)
        
    finally:
        session.close()
        engine.dispose()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)