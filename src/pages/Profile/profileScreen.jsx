import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import styles from './profileScreen.module.css';

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  
  // State for form fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // State for profile image: can be a URL string or a File object
  const [profileImage, setProfileImage] = useState(user?.profile_photo || null);
  // State for the image preview URL
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo || null);

  // Ref for the hidden file input
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    // Clean up the object URL when the component unmounts or the image changes
    return () => {
      if (previewUrl && !previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // Validation logic... (same as before)
    if (newPassword && newPassword !== confirmPassword) {
        alert('As novas senhas não coincidem.');
        return;
    }

    setLoading(true);

    // FormData is the standard way to send files to a server
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    
    // Only append image if it's a new File object
    if (profileImage instanceof File) {
        formData.append('profile_photo', profileImage);
    }

    if (newPassword) {
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
    }
    
    // Note: Your updateProfile function must be adapted to handle FormData
    const result = await updateProfile(formData);
    
    if (result.success) {
      alert('Perfil atualizado com sucesso!');
    } else {
      alert(`Erro: ${result.error}`);
    }
    setLoading(false);
  };

  const handleSelectImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(file); // Store the file object
      setPreviewUrl(URL.createObjectURL(file)); // Create a URL for preview
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      setProfileImage(null);
      setPreviewUrl(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <main className={styles.container}>
      <form onSubmit={handleUpdateProfile}>
        <section className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className={styles.profileImage} />
            ) : (
              <div className={styles.profileImagePlaceholder}>
                <span>{name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleSelectImage}
            style={{ display: 'none' }}
          />
          <div className={styles.imageButtons}>
            <button type="button" className={styles.imageButton} onClick={() => fileInputRef.current.click()}>
              Alterar Foto
            </button>
            {previewUrl && (
              <button type="button" className={`${styles.imageButton} ${styles.removeButton}`} onClick={handleRemoveImage}>
                Remover
              </button>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações Pessoais</h2>
          <div className={styles.inputContainer}>
            <label htmlFor="name" className={styles.label}>Nome Completo</label>
            <input id="name" type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="email" className={styles.label}>Endereço de Email</label>
            <input id="email" type="email" className={`${styles.input} ${styles.disabledInput}`} value={email} readOnly />
            <p className={styles.helperText}>O email não pode ser alterado.</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alterar Senha</h2>
          <div className={styles.inputContainer}>
            <label htmlFor="currentPassword" className={styles.label}>Senha Atual</label>
            <input id="currentPassword" type="password" className={styles.input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="newPassword" className={styles.label}>Nova Senha</label>
            <input id="newPassword" type="password" className={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirmar Nova Senha</label>
            <input id="confirmPassword" type="password" className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </section>
        
        <section className={styles.buttonSection}>
          <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={loading}>
            {loading ? 'Atualizando...' : 'Salvar Alterações'}
          </button>
          <button type="button" className={`${styles.button} ${styles.logoutButton}`} onClick={handleLogout}>
            Sair (Logout)
          </button>
        </section>
      </form>
    </main>
  );
};

export default ProfileScreen;