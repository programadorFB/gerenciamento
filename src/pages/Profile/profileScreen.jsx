import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCheck } from 'react-icons/md';
import styles from './profileScreen.module.css';

// Avatares pré-definidos - você pode substituir pelas URLs reais dos seus avatares
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

  // Estado para o avatar selecionado (armazena o ID do avatar)
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_photo || null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSelectedAvatar(user.profile_photo || null);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validação
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

    setLoading(true);

    try {
      // Criar objeto com os dados para enviar ao backend
      const updateData = {
        name: name.trim()
      };
      
      // Lógica do avatar:
      // 1. Se há um avatar selecionado, enviar o ID
      // 2. Se não há avatar E o usuário tinha antes, marcar para remover
      if (selectedAvatar) {
        updateData.profile_photo = selectedAvatar;
        console.log('✅ Enviando avatar:', selectedAvatar);
      } else if (user?.profile_photo && !selectedAvatar) {
        updateData.remove_profile_photo = true;
        console.log('🗑️ Removendo avatar');
      }

      // Adicionar campos de senha apenas se ambos estiverem preenchidos
      if (newPassword && currentPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
        console.log('🔐 Alterando senha');
      }
      
      console.log('📤 Dados completos enviados:', updateData);
      
      const result = await updateProfile(updateData);
      
      console.log('📥 Resposta do servidor:', result);
      
      if (result && result.success) { 
        alert('Perfil atualizado com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Atualizar o estado com o avatar retornado
        if (result.user) {
          setSelectedAvatar(result.user.profile_photo || null);
          console.log('✅ Avatar atualizado no estado:', result.user.profile_photo);
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
      console.error('❌ Error details:', error.response?.data || error.message);
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

  // Buscar a URL do avatar atual
  const getCurrentAvatarUrl = () => {
    if (!selectedAvatar) return null;
    const avatar = PREDEFINED_AVATARS.find(a => a.id === selectedAvatar);
    return avatar ? avatar.url : null;
  };
  
  return (
    <main className={styles.container}>
      {/* Header with back button */}
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

          {/* Seletor de Avatares */}
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
            disabled={loading || !name.trim()}
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