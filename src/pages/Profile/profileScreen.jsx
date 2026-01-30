import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdLock, MdEmail, MdEdit } from 'react-icons/md';
import { FaUserTie, FaCoins, FaCheckCircle } from 'react-icons/fa';
import { GiPokerHand } from 'react-icons/gi';
import styles from './profileScreen.module.css';

// 1. Importar imagens locais
import avatar1 from '../../assets/avatares/1.png';
import avatar2 from '../../assets/avatares/2.png';
import avatar3 from '../../assets/avatares/3.png';
import avatar4 from '../../assets/avatares/4.png';
import avatar5 from '../../assets/avatares/5.png';
import avatar6 from '../../assets/avatares/6.png';

const AVATAR_MAP = {
  'avatar1': avatar1,
  'avatar2': avatar2,
  'avatar3': avatar3,
  'avatar4': avatar4,
  'avatar5': avatar5,
  'avatar6': avatar6
};

const AVATAR_OPTIONS = [
  { id: 'avatar1', name: 'Dealer' },
  { id: 'avatar2', name: 'Shark' },
  { id: 'avatar3', name: 'High Roller' },
  { id: 'avatar4', name: 'Ace' },
  { id: 'avatar5', name: 'King' },
  { id: 'avatar6', name: 'Queen' }
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
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'JG';
  };

  const mainImageSrc = selectedAvatarId ? AVATAR_MAP[selectedAvatarId] : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
          <MdArrowBack size={20} /> <span>MESA</span>
        </button>
        <h1 className={styles.title}>Dossiê do Jogador</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      <div className={styles.scrollContainer}>
        <div className={styles.profileCardWrapper}>
          
          {/* Seção Visual (Esquerda/Topo) */}
          <div className={styles.visualSection}>
            <div className={styles.avatarDisplay}>
              <div className={styles.avatarRing}>
                {mainImageSrc ? (
                  <img src={mainImageSrc} alt="Avatar" className={styles.profileImage} />
                ) : (
                  <div className={styles.profileImagePlaceholder}>
                    <span>{getInitials()}</span>
                  </div>
                )}
                <div className={styles.vipBadge}>VIP</div>
              </div>
            </div>
            
            <div className={styles.chipSelector}>
              <h3 className={styles.selectorTitle}>Escolha sua Identidade</h3>
              <div className={styles.chipsGrid}>
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.chipOption} ${selectedAvatarId === option.id ? styles.chipSelected : ''}`}
                    onClick={() => handleSelectAvatar(option.id)}
                    title={option.name}
                  >
                    <img src={AVATAR_MAP[option.id]} alt={option.name} />
                    {selectedAvatarId === option.id && <div className={styles.checkOverlay}><FaCheckCircle /></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção Formulário (Direita/Baixo) */}
          <form onSubmit={handleUpdateProfile} className={styles.formSection}>
            
            <div className={styles.sectionBlock}>
              <h2 className={styles.blockTitle}><FaUserTie /> Credenciais</h2>
              
              <div className={styles.inputGroup}>
                <label>Nome do Jogador</label>
                <div className={styles.inputWrapper}>
                  <input 
                    className={styles.input} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Seu nome na mesa"
                  />
                  <MdEdit className={styles.inputIcon} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Email Cadastrado</label>
                <div className={styles.inputWrapper}>
                  <input 
                    className={`${styles.input} ${styles.disabled}`} 
                    value={user?.email || ''} 
                    disabled 
                  />
                  <MdEmail className={styles.inputIcon} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Banca Inicial (Buy-in)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.prefix}>R$</span>
                  <input 
                    className={styles.input} 
                    value={initialBank}
                    onChange={e => setInitialBank(formatCurrency(e.target.value))}
                    placeholder="0,00"
                    style={{paddingLeft: '35px'}}
                  />
                  <FaCoins className={styles.inputIcon} style={{color: '#D4AF37'}} />
                </div>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <h2 className={styles.blockTitle}><MdLock /> Segurança</h2>
              
              <div className={styles.passwordGrid}>
                <div className={styles.inputGroup}>
                  <label>Senha Atual</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Nova Senha</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Confirmar</label>
                  <input 
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
              </div>
            </div>

            <div className={styles.actionFooter}>
              <button type="button" onClick={() => logout()} className={styles.logoutButton}>
                SAIR
              </button>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'PROCESSANDO...' : 'ATUALIZAR DADOS'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;