import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCheck, MdLock, MdPerson, MdEmail } from 'react-icons/md';
import { FaCoins, FaUserEdit } from 'react-icons/fa';
import styles from './profileScreen.module.css';

// 1. Importar imagens locais
import avatar1 from '../../assets/avatares/1.png';
import avatar2 from '../../assets/avatares/2.png';
import avatar3 from '../../assets/avatares/3.png';
import avatar4 from '../../assets/avatares/4.png';
import avatar5 from '../../assets/avatares/5.png';
import avatar6 from '../../assets/avatares/6.png';

// 2. Mapa de Avatares
const AVATAR_MAP = {
  'avatar1': avatar1,
  'avatar2': avatar2,
  'avatar3': avatar3,
  'avatar4': avatar4,
  'avatar5': avatar5,
  'avatar6': avatar6
};

const AVATAR_OPTIONS = [
  { id: 'avatar1', name: 'Avatar 1' },
  { id: 'avatar2', name: 'Avatar 2' },
  { id: 'avatar3', name: 'Avatar 3' },
  { id: 'avatar4', name: 'Avatar 4' },
  { id: 'avatar5', name: 'Avatar 5' },
  { id: 'avatar6', name: 'Avatar 6' }
];

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [name, setName] = useState('');
  const [initialBank, setInitialBank] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      
      const savedAvatar = user.avatar_url || user.profile_photo;
      if (savedAvatar && AVATAR_MAP[savedAvatar]) {
        setSelectedAvatarId(savedAvatar);
      } else {
        setSelectedAvatarId(null);
      }

      if (user.initial_bank) {
        const val = parseFloat(user.initial_bank);
        if (!isNaN(val)) setInitialBank(val.toFixed(2).replace('.', ','));
      }
    }
  }, [user]); 

  const handleSelectAvatar = (id) => {
    setSelectedAvatarId(id);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword) {
        if (newPassword !== confirmPassword) throw new Error('Senhas não conferem.');
        if (!currentPassword) throw new Error('Senha atual é necessária.');
      }

      const payload = {
        name: name.trim(),
        profile_photo: selectedAvatarId 
      };

      if (!selectedAvatarId && (user.avatar_url || user.profile_photo)) {
        payload.remove_profile_photo = true;
      }

      if (initialBank) {
        const bankVal = parseFloat(initialBank.replace(',', '.'));
        if (!isNaN(bankVal) && bankVal > 0) payload.initial_bank = bankVal;
      }

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const result = await updateProfile(payload);

      if (result.success) {
        alert('Perfil atualizado com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.error || 'Erro ao salvar');
      }

    } catch (error) {
      console.error(error);
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) => {
    let val = v.replace(/[^\d,]/g, '');
    if (val.split(',').length > 2) val = val.replace(/,+$/, '');
    return val;
  };

  const getInitials = () => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'MP';
  };

  const mainImageSrc = selectedAvatarId ? AVATAR_MAP[selectedAvatarId] : null;

  return (
    <div className={styles.container}>
      <div className={styles.scrollContainer}>
        <div className={styles.profileCardWrapper}>
          <div className={styles.form}>
            
            <header className={styles.header}>
              <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
                <MdArrowBack size={20} />
              </button>
              <h1 className={styles.title}>Cartão de Membro</h1>
              <div className={styles.headerSpacer}></div>
            </header>

            <form onSubmit={handleUpdateProfile}>
              {/* SEÇÃO DE IMAGEM */}
              <section className={styles.imageSection}>
                <div className={styles.imageContainer}>
                  {mainImageSrc ? (
                    <img 
                      src={mainImageSrc} 
                      alt="Avatar Selecionado" 
                      className={styles.profileImage} 
                    />
                  ) : (
                    <div className={styles.profileImagePlaceholder}>
                      <span>{getInitials()}</span>
                    </div>
                  )}
                </div>

                {selectedAvatarId && (
                  <div className={styles.imageButtons}>
                    <button 
                      type="button"
                      className={styles.removeButton}
                      onClick={() => setSelectedAvatarId(null)}
                    >
                      Remover
                    </button>
                  </div>
                )}

                <div className={styles.avatarSelector}>
                  <h3 className={styles.avatarSelectorTitle}>Selecione sua Ficha</h3>
                  <div className={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.avatarOption} ${
                          selectedAvatarId === option.id ? styles.avatarOptionSelected : ''
                        }`}
                        onClick={() => handleSelectAvatar(option.id)}
                      >
                        <img 
                          src={AVATAR_MAP[option.id]} 
                          alt={option.name} 
                          className={styles.avatarOptionImage} 
                        />
                        {selectedAvatarId === option.id && (
                          <div className={styles.avatarCheckmark}>
                            <MdCheck size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* DADOS PESSOAIS */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><MdPerson /> Dados do Jogador</h2>
                
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Nome</label>
                  <input 
                    className={styles.input} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}>
                    <FaCoins style={{marginRight: 5, color: '#D4AF37'}}/> Banca Inicial
                  </label>
                  <div className={styles.currencyInputWrapper}>
                    <span className={styles.currencySymbol}>R$</span>
                    <input 
                      className={styles.currencyInput} 
                      value={initialBank}
                      onChange={e => setInitialBank(formatCurrency(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className={styles.inputContainer}>
                  <label className={styles.label}><MdEmail style={{marginRight: 5}}/> Email</label>
                  <input 
                    className={`${styles.input} ${styles.disabledInput}`} 
                    value={user?.email || ''} 
                    disabled 
                  />
                </div>
              </section>

              {/* SEGURANÇA */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><MdLock /> Credenciais</h2>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Senha Atual</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Nova Senha</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className={styles.inputContainer}>
                  <label className={styles.label}>Confirmar Nova Senha</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
              </section>

              <section className={styles.buttonSection}>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Salvando...' : 'ATUALIZAR PERFIL'}
                </button>
                <button type="button" onClick={() => logout()} className={styles.logoutButton}>
                  SAIR DO SISTEMA
                </button>
              </section>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;