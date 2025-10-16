import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSideMenu } from '../contexts/SideMenuContext.jsx';

// Ícones
import { MdDashboard, MdLogout, MdClose, MdCalculate, MdPlayCircle } from 'react-icons/md';
import { FaChartLine, FaBullseye, FaUserTie, FaFileExport, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { FiDownload, FiSettings } from 'react-icons/fi';

// CSS Module
import styles from './Sidemenu.module.css';

const MenuItem = ({ icon, text, onClick, isLogout = false, isNew = false }) => {
  const itemClasses = [
    styles.menuItem,
    isLogout ? styles.logoutItem : '',
    isNew ? styles.newItem : ''
  ].join(' ').trim();

  return (
    <button className={itemClasses} onClick={onClick}>
      <div className={styles.menuIcon}>{icon}</div>
      <span className={styles.menuText}>{text}</span>
    </button>
  );
};

const SideMenu = () => {
  const { menuVisible, closeMenu, isCollapsed, toggleCollapse } = useSideMenu();
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

  const containerClasses = `${styles.container} ${menuVisible ? styles.visible : ''} ${isCollapsed ? styles.collapsed : ''}`;

  return (
    <>
      {menuVisible && <div className={styles.overlay} onClick={closeMenu} />}

      <aside className={containerClasses}>
        {/* --- ADICIONADO: Botão de fechar no topo do menu --- */}
        <button className={styles.closeButton} onClick={closeMenu} title="Fechar menu">
          <MdClose size={24} />
        </button>

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
            icon={<FaFileExport size={20} />}
            text="Gerar Relatório"
            onClick={() => handleNavigation('/report')}
          />
          <MenuItem
            icon={<FiDownload size={22} />}
            text="Lançamentos"
            onClick={() => handleNavigation('/transaction')}
          />
          <MenuItem
            icon={<FaBullseye size={20} />}
            text="Objetivos"
            onClick={() => handleNavigation('/objectives')}
          />
          <MenuItem
            icon={<FaUserTie size={20} />}
            text="Perfil de Investimento"
            onClick={() => handleNavigation('/investment-profile')}
          />
          <div className={styles.separator} />
          <MenuItem
            icon={<MdPlayCircle size={24} />}
            text="Estratégia"
            onClick={() => handleNavigation('/strategy')}
            
          />
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
          <button className={styles.collapseButton} onClick={toggleCollapse}>
            <div className={styles.menuIcon}>
              {isCollapsed ? <FaAngleDoubleRight size={20} /> : <FaAngleDoubleLeft size={20} />}
            </div>
            <span className={styles.menuText}>Recolher</span>
          </button>
          <p className={styles.footerText}>Financial Control v1.0</p>
        </footer>
      </aside>
    </>
  );
};

export default SideMenu;