import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import styles from './profileScreen.module.css';

// OBSERVAÇÃO: A constante PREDEFINED_AVATARS foi removida, focando apenas no upload de arquivo.

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // State para o arquivo de foto local antes do upload
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  
  // State para a URL de exibição (assumindo que o servidor serve arquivos de /uploads/profiles/)
const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    user?.profile_photo ? `${STATIC_BASE_URL}/uploads/profiles/${user.profile_photo}` : null
);
  
  const fileInputRef = useRef(null);

useEffect(() => {
    if (user) {
      setName(user.name || '');
      // user.profile_photo contém o nome do arquivo (ex: 'profile_1_16788888.jpg')
      setProfilePhotoUrl(user.profile_photo ? `${STATIC_BASE_URL}/uploads/profiles/${user.profile_photo}` : null);
    }
    // Limpa a URL temporária de pré-visualização ao desmontar (opcional)
    return () => {
      if (profilePhotoUrl && profilePhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoUrl);
      }
    };
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validation logic
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
      const formData = new FormData();
      formData.append('name', name.trim());
      
      // 1. ANEXAR FOTO DE PERFIL
      if (profilePhotoFile) {
        // Envia o arquivo real no campo 'profile_photo', conforme esperado pelo routes.py
        formData.append('profile_photo', profilePhotoFile);
      } 
      
      // 2. ANEXAR REMOÇÃO
      // Condição: Se o usuário tinha uma foto ANTES (user?.profile_photo)
      // E não selecionou um novo arquivo (profilePhotoFile é null)
      // E o URL de visualização está limpo (profilePhotoUrl é null), o que significa que ele clicou em "Remover".
      if (!profilePhotoFile && !profilePhotoUrl && user?.profile_photo) {
        // Envia o comando de remoção 'remove_profile_photo' para o backend
        formData.append('remove_profile_photo', 'true');
      }

      // Adicionar campos de senha
      if (newPassword) {
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
      }
      
const result = await updateProfile(formData);
      
      // CORREÇÃO: Verifica se result.success é true E se result.user existe
      if (result.success && result.user) { 
        alert('Perfil atualizado com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Acesso seguro ao profile_photo
        const newProfilePhoto = result.user.profile_photo;
        
 if (newProfilePhoto) {
          // Usa o nome do arquivo retornado pelo backend para formar a URL completa
          setProfilePhotoUrl(`${STATIC_BASE_URL}/uploads/profiles/${newProfilePhoto}`);
      } else {
          setProfilePhotoUrl(null);
      }
        setProfilePhotoFile(null);
        
      } else {
        // Se result.success for false ou result.user for undefined, trata como erro
        alert(`Erro: ${result.error || 'Não foi possível atualizar o perfil. Verifique sua senha atual.'}`);
      }
    } catch (error) {
      alert('Erro ao atualizar perfil. Tente novamente.');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      // Cria uma URL temporária para pré-visualização (blob:http://...)
      setProfilePhotoUrl(URL.createObjectURL(file)); 
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      // Se houver uma URL temporária (blob), revoga para liberar memória
      if (profilePhotoUrl && profilePhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoUrl);
      }
      setProfilePhotoUrl(null); 
      setProfilePhotoFile(null);
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
            {profilePhotoUrl ? (
              // Exibe a foto real (do servidor ou a temporária)
              <img 
                src={profilePhotoUrl} 
                alt="Foto de Perfil"
                className={styles.profileImage}
              />
            ) : (
              // Placeholder
              <div className={styles.profileImagePlaceholder}>
                <span>{getInitials()}</span>
              </div>
            )}
          </div>
          
          <div className={styles.imageButtons}>
            {/* Input de arquivo real, escondido */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
              disabled={loading}
            />
            
            <button 
              type="button" 
              className={styles.imageButton} 
              // Clica no input de arquivo escondido
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              Escolher Foto
            </button>
            {(profilePhotoUrl || profilePhotoFile) && (
              <button 
                type="button" 
                className={`${styles.imageButton} ${styles.removeButton}`} 
                onClick={handleRemoveAvatar}
                disabled={loading}
              >
                Remover Foto
              </button>
            )}
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
            {loading ? (
              'Atualizando...'
            ) : (
              'Salvar Alterações'
            )}
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