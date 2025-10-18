import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCheck } from 'react-icons/md';
import { FaCoins } from 'react-icons/fa';
import styles from './profileScreen.module.css';

// Importar avatares locais
import avatar1 from '../../assets/avatares/1.png';
import avatar2 from '../../assets/avatares/2.png';
import avatar3 from '../../assets/avatares/3.png';
import avatar4 from '../../assets/avatares/4.png';
import avatar5 from '../../assets/avatares/5.png';
import avatar6 from '../../assets/avatares/6.png';

// Avatares pré-definidos com imagens locais
const PREDEFINED_AVATARS = [
  { id: 'avatar1', url: avatar1, name: 'Avatar 1' },
  { id: 'avatar2', url: avatar2, name: 'Avatar 2' },
  { id: 'avatar3', url: avatar3, name: 'Avatar 3' },
  { id: 'avatar4', url: avatar4, name: 'Avatar 4' },
  { id: 'avatar5', url: avatar5, name: 'Avatar 5' },
  { id: 'avatar6', url: avatar6, name: 'Avatar 6' }
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
  const [errorDetails, setErrorDetails] = useState(null);

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
    console.log('🔵 User data loaded:', user);
    
    if (user) {
      setName(user.name || '');
      setSelectedAvatar(user.profile_photo || null);

      // Formatar banca inicial (converte 1000.50 → "1000,50")
      if (user.initial_bank !== null && user.initial_bank !== undefined) {
        const bankValue = parseFloat(user.initial_bank);
        if (!isNaN(bankValue)) {
          const formattedBank = bankValue.toFixed(2).replace('.', ',');
          setInitialBank(formattedBank);
          console.log('💰 Initial bank loaded:', formattedBank);
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
    setErrorDetails(null);
    
    console.log('🚀 Starting profile update...');
    
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
        initial_bank: bankAmount
      };
      
      // Lógica do avatar
      if (selectedAvatar) {
        updateData.profile_photo = selectedAvatar;
        console.log('✅ Sending avatar:', selectedAvatar);
      } else if (user?.profile_photo && !selectedAvatar) {
        updateData.remove_profile_photo = true;
        console.log('🗑️ Removing avatar');
      }

      // Adicionar campos de senha se preenchidos
      if (newPassword && currentPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
        console.log('🔑 Changing password');
      }
      
      console.log('📤 Data to send:', JSON.stringify(updateData, null, 2));
      console.log('📡 Calling updateProfile function...');
      
      const result = await updateProfile(updateData);
      
      console.log('📥 Server response:', JSON.stringify(result, null, 2));
      
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
          
          console.log('✅ States updated successfully');
        }
      } else {
        const errorMessage = result?.error || result?.message || 'Não foi possível atualizar o perfil.';
        alert(`Erro: ${errorMessage}`);
        console.error('❌ Error details:', result);
        setErrorDetails(result);
      }
    } catch (error) {
      console.error('❌ COMPLETE ERROR OBJECT:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.response) {
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ Request was made but no response:', error.request);
      }
      
      let errorMsg = 'Erro ao atualizar perfil';
      
      if (error.message === 'Network Error') {
        errorMsg = 'Erro de conexão. Verifique:\n\n' +
                   '1. Se o servidor backend está rodando\n' +
                   '2. Se a URL da API está correta\n' +
                   '3. Se há problemas de CORS\n' +
                   '4. Sua conexão com a internet';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`${errorMsg}`);
      setErrorDetails({
        name: error.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = (avatarId) => {
    console.log('🖼️ Avatar selected:', avatarId);
    setSelectedAvatar(avatarId);
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      console.log('🗑️ Avatar removed');
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

      {/* Debug Info - Remover em produção */}
      {errorDetails && (
        <div style={{
          margin: '20px',
          padding: '15px',
          backgroundColor: '#330000',
          border: '1px solid #ff0000',
          borderRadius: '8px',
          color: '#ff6666',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(errorDetails, null, 2)}
          </pre>
        </div>
      )}

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
                  title={avatar.name}
                >
                  <img 
                    src={avatar.url} 
                    alt={avatar.name}
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