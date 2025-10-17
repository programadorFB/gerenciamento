import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCheck } from 'react-icons/md';
import { FaCoins } from 'react-icons/fa';
import styles from './profileScreen.module.css';

// Avatares pré-definidos
const PREDEFINED_AVATARS = [
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
  { id: 'avatar7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella' },
  { id: 'avatar8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { id: 'avatar9', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo' },
  { id: 'avatar10', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy' },
  { id: 'avatar11', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
  { id: 'avatar12', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily' }
];

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialBank, setInitialBank] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_photo || null);

  // ✅ Função para formatar entrada de moeda
  const formatCurrencyInput = (value) => {
    let cleaned = value.replace(/[^\d,]/g, '');
    
    const commaCount = cleaned.split(',').length - 1;
    if (commaCount > 1) {
      cleaned = cleaned.replace(/,+$/, '');
    }
    
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length > 2) {
        cleaned = parts[0] + ',' + parts[1].substring(0, 2);
      }
    }
    
    return cleaned;
  };

  // ✅ Handler para mudança na banca inicial
  const handleInitialBankChange = (e) => {
    const formattedValue = formatCurrencyInput(e.target.value);
    setInitialBank(formattedValue);
  };

  // ✅ Inicializar estados com dados do usuário
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSelectedAvatar(user.profile_photo || null);

      // Formatar banca inicial (converte 1000.50 → "1000,50")
      if (user.initial_bank !== null && user.initial_bank !== undefined) {
        const bankValue = parseFloat(user.initial_bank);
        if (!isNaN(bankValue)) {
          const formattedBank = bankValue.toFixed(2).replace('.', ',');
          setInitialBank(formattedBank);
        } else {
          setInitialBank('');
        }
      } else {
        setInitialBank('');
      }
    }
  }, [user]);

  // ✅ Handler de atualização do perfil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validações
    if (newPassword && newPassword !== confirmPassword) {
      alert('As novas senhas não coincidem.');
      return;
    }

    if (newPassword && !currentPassword) {
      alert('Para alterar a senha, é necessário informar a senha atual.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // ✅ Validar banca inicial
    if (!initialBank || initialBank.trim() === '') {
      alert('A banca inicial é obrigatória.');
      return;
    }

    const bankAmount = parseFloat(initialBank.replace(',', '.'));
    if (isNaN(bankAmount) || bankAmount <= 0) {
      alert('O valor da banca inicial deve ser maior que zero.');
      return;
    }

    setLoading(true);

    try {
      // Criar objeto com os dados para enviar ao backend
      const updateData = {
        name: name.trim(),
        initial_bank: bankAmount // ✅ Enviar banca inicial
      };
      
      // Lógica do avatar
      if (selectedAvatar) {
        updateData.profile_photo = selectedAvatar;
        console.log('✅ Enviando avatar:', selectedAvatar);
      } else if (user?.profile_photo && !selectedAvatar) {
        updateData.remove_profile_photo = true;
        console.log('🗑️ Removendo avatar');
      }

      // Adicionar campos de senha se preenchidos
      if (newPassword && currentPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
        console.log('🔒 Alterando senha');
      }
      
      console.log('📤 Dados enviados:', updateData);
      
      const result = await updateProfile(updateData);
      
      console.log('📥 Resposta do servidor:', result);
      
      if (result && result.success) { 
        alert('Perfil atualizado com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Atualizar estados com dados retornados
        if (result.user) {
          setSelectedAvatar(result.user.profile_photo || null);
          
          // ✅ Atualizar banca inicial se retornada
          if (result.user.initial_bank !== null && result.user.initial_bank !== undefined) {
            const updatedBank = parseFloat(result.user.initial_bank);
            if (!isNaN(updatedBank)) {
              const formattedBank = updatedBank.toFixed(2).replace('.', ',');
              setInitialBank(formattedBank);
            }
          }
          
          console.log('✅ Estados atualizados');
        }
      } else {
        const errorMessage = result?.error || result?.message || 'Não foi possível atualizar o perfil.';
        alert(`Erro: ${errorMessage}`);
        console.error('❌ Erro detalhado:', result);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert(`Erro ao atualizar perfil: ${errorMsg}`);
      console.error('❌ Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      setSelectedAvatar(null);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getInitials = () => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCurrentAvatarUrl = () => {
    if (!selectedAvatar) return null;
    const avatar = PREDEFINED_AVATARS.find(a => a.id === selectedAvatar);
    return avatar ? avatar.url : null;
  };
  
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button 
          type="button" 
          onClick={handleGoBack} 
          className={styles.backButton}
          disabled={loading}
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className={styles.title}>Meu Perfil</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      <form onSubmit={handleUpdateProfile}>
        <section className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {getCurrentAvatarUrl() ? (
              <img 
                src={getCurrentAvatarUrl()} 
                alt="Foto de Perfil"
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profileImagePlaceholder}>
                <span>{getInitials()}</span>
              </div>
            )}
          </div>
          
          {selectedAvatar && (
            <div className={styles.imageButtons}>
              <button 
                type="button" 
                className={`${styles.imageButton} ${styles.removeButton}`} 
                onClick={handleRemoveAvatar}
                disabled={loading}
              >
                Remover Foto
              </button>
            </div>
          )}

          <div className={styles.avatarSelector}>
            <h3 className={styles.avatarSelectorTitle}>Escolha seu Avatar</h3>
            <div className={styles.avatarGrid}>
              {PREDEFINED_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`${styles.avatarOption} ${
                    selectedAvatar === avatar.id ? styles.avatarOptionSelected : ''
                  }`}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  disabled={loading}
                >
                  <img 
                    src={avatar.url} 
                    alt={`Avatar ${avatar.id}`}
                    className={styles.avatarOptionImage}
                  />
                  {selectedAvatar === avatar.id && (
                    <div className={styles.avatarCheckmark}>
                      <MdCheck size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ SEÇÃO DE INFORMAÇÕES PESSOAIS COM BANCA INICIAL */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações Pessoais</h2>
          
          <div className={styles.inputContainer}>
            <label htmlFor="name" className={styles.label}>
              Nome Completo *
            </label>
            <input 
              id="name" 
              type="text" 
              className={styles.input} 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Seu nome completo"
            />
          </div>
          
          {/* ✅ CAMPO DE BANCA INICIAL */}
          <div className={styles.inputContainer}>
            <label htmlFor="initialBank" className={styles.label}>
              <FaCoins className={styles.labelIcon} /> Banca Inicial *
            </label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencySymbol}>R$</span>
              <input
                id="initialBank"
                type="text"
                inputMode="decimal"
                className={styles.currencyInput}
                value={initialBank}
                onChange={handleInitialBankChange}
                placeholder="1000,00"
                required
                disabled={loading}
              />
            </div>
            <p className={styles.helperText}>
              💡 Este valor serve como base para cálculos de ROI e objetivos. Altere apenas se necessário.
            </p>
            <p className={styles.warningText}>
              ⚠️ Ao alterar a banca inicial, o sistema criará uma transação de ajuste automática.
            </p>
          </div>

          <div className={styles.inputContainer}>
            <label htmlFor="email" className={styles.label}>
              Endereço de Email
            </label>
            <input 
              id="email" 
              type="email" 
              className={`${styles.input} ${styles.disabledInput}`} 
              value={user?.email || ''} 
              readOnly 
              disabled
              placeholder="seu@email.com"
            />
            <p className={styles.helperText}>
              O email não pode ser alterado. Entre em contato com o suporte se necessário.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Senha</h2>
          <p className={styles.helperText} style={{ marginBottom: '20px' }}>
            Deixe em branco se não quiser alterar a senha.
          </p>
          
          <div className={styles.inputContainer}>
            <label htmlFor="currentPassword" className={styles.label}>
              Senha Atual
            </label>
            <input 
              id="currentPassword" 
              type="password" 
              className={styles.input} 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <div className={styles.inputContainer}>
            <label htmlFor="newPassword" className={styles.label}>
              Nova Senha
            </label>
            <input 
              id="newPassword" 
              type="password" 
              className={styles.input} 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha (mín. 6 caracteres)"
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <div className={styles.inputContainer}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar Nova Senha
            </label>
            <input 
              id="confirmPassword" 
              type="password" 
              className={styles.input} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              disabled={loading}
              minLength={6}
            />
          </div>
        </section>
        
        <section className={styles.buttonSection}>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.saveButton}`} 
            disabled={loading || !name.trim() || !initialBank.trim()}
          >
            {loading ? 'Atualizando...' : 'Salvar Alterações'}
          </button>
          
          <button 
            type="button" 
            className={`${styles.button} ${styles.logoutButton}`} 
            onClick={handleLogout}
            disabled={loading}
          >
            Sair da Conta
          </button>
        </section>
      </form>
    </main>
  );
};

export default ProfileScreen;