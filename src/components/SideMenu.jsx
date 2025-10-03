import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSideMenu } from '../contexts/SideMenuContext.jsx';

// Ícones
import { MdDashboard, MdLogout } from 'react-icons/md';
import { FaChartLine, FaBullseye, FaUserTie } from 'react-icons/fa';
import { FiDownload, FiSettings } from 'react-icons/fi';

// CSS Module
import styles from './SideMenu.module.css';

const MenuItem = ({ icon, text, onClick, isLogout = false }) => {
  const itemClasses = `${styles.menuItem} ${isLogout ? styles.logoutItem : ''}`;
  return (
    <button className={itemClasses} onClick={onClick}>
      <div className={styles.menuIcon}>{icon}</div>
      <span className={styles.menuText}>{text}</span>
    </button>
  );
};

const SideMenu = () => {
  const { menuVisible, closeMenu } = useSideMenu();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleLogout = () => {
    if (window.confirm('Você tem certeza que deseja sair?')) {
      logout().then(() => {
        closeMenu();
        navigate('/login');
      });
    }
  };

  const containerClasses = `${styles.container} ${menuVisible ? styles.visible : ''}`;

  return (
    <>
      {menuVisible && <div className={styles.overlay} onClick={closeMenu} />}

      <aside className={containerClasses}>
        <div className={styles.profileSection}>
          <h3 className={styles.userName}>{user?.name || 'User'}</h3>
          <p className={styles.userEmail}>{user?.email || 'user@example.com'}</p>
        </div>

        <nav className={styles.menuItems}>
          <MenuItem
            icon={<MdDashboard size={24} />}
            text="Dashboard"
            onClick={() => handleNavigation('/dashboard')}
          />
          <MenuItem
            icon={<FaChartLine size={20} />}
            text="Análise"
            onClick={() => handleNavigation('/charts')}
          />
          <MenuItem
            icon={<FiDownload size={22} />}
            text="Lançamentos"
            onClick={() => handleNavigation('/transaction')} // Este já estava correto
          />
          {/* --- ALTERAÇÃO PRINCIPAL AQUI ---
            Agora, ao clicar em "Objetivos", navegamos para a mesma tela de transações,
            mas passamos um parâmetro na URL para que a aba de objetivos seja aberta por padrão.
          */}
          <MenuItem
            icon={<FaBullseye size={20} />}
            text="Objetivos"
            onClick={() => handleNavigation('/transaction?showObjectives=true')}
          />
          <MenuItem
            icon={<FaUserTie size={20} />}
            text="Perfil de Investimento"
            onClick={() => handleNavigation('/investment-profile')}
          />
          <div className={styles.separator} />
          <MenuItem
            icon={<FiSettings size={22} />}
            text="Configurações de Perfil"
            onClick={() => handleNavigation('/profile')}
          />
          <MenuItem
            icon={<MdLogout size={24} />}
            text="Logout"
            onClick={handleLogout}
            isLogout
          />
        </nav>

        <footer className={styles.footer}>
          <p className={styles.footerText}>Financial Control v1.0</p>
        </footer>
      </aside>
    </>
  );
};

export default SideMenu;