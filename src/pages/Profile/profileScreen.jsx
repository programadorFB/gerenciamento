import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import styles from './profileScreen.module.css';

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for form fields
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // State for profile image
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo || null);
  const initialProfilePhoto = useRef(user?.profile_photo); // Ref para a URL original da foto

  // Ref for the hidden file input
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setName(user.name || '');
      // O email não pode ser alterado, então não precisa ser um estado mutável
      setPreviewUrl(user.profile_photo || null);
      initialProfilePhoto.current = user.profile_photo;
    }
  }, [user]);

  useEffect(() => {
    // Clean up the object URL when the component unmounts
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      // Create FormData for the request
      const formData = new FormData();
      formData.append('name', name.trim());
      
      // ✅ CORREÇÃO: Adicionar a lógica para remover a foto de perfil
      const isImageRemoved = initialProfilePhoto.current && previewUrl === null;
      if (isImageRemoved) {
        formData.append('remove_profile_photo', 'true');
      }

      // Add profile image if selected and is a new file
      if (profileImage instanceof File) {
        formData.append('profile_photo', profileImage);
      }
      
      // Add password fields if changing password
      if (newPassword) {
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
      }
      
      // Call updateProfile from AuthContext
      const result = await updateProfile(formData);
      
      if (result.success) {
        alert('Perfil atualizado com sucesso!');
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Reset profile image state to prevent re-upload on next save
        setProfileImage(null);
      } else {
        alert(`Erro: ${result.error || 'Não foi possível atualizar o perfil'}`);
      }
    } catch (error) {
      alert('Erro ao atualizar perfil. Tente novamente.');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.).');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      setProfileImage(file); // Store the file object
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      setProfileImage(null);
      setPreviewUrl(null);
      // O campo 'remove_profile_photo' será adicionado no FormData em handleUpdateProfile
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
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Profile" 
                className={styles.profileImage}
                onError={(e) => {
                  // If image fails to load, show placeholder
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className={styles.profileImagePlaceholder}>
                <span>{getInitials()}</span>
              </div>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleSelectImage}
            style={{ display: 'none' }}
            disabled={loading}
          />
          
          <div className={styles.imageButtons}>
            <button 
              type="button" 
              className={styles.imageButton} 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Alterar Foto
            </button>
            {/* ✅ CORREÇÃO: O botão de remover agora é exibido se houver uma foto de perfil original ou um preview URL */}
            {(initialProfilePhoto.current || previewUrl) && (
              <button 
                type="button" 
                className={`${styles.imageButton} ${styles.removeButton}`} 
                onClick={handleRemoveImage}
                disabled={loading}
              >
                Remover
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
              <>
                <span className={styles.loadingSpinner}></span>
                Atualizando...
              </>
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