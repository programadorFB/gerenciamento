import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Ícones
import { FaCoins, FaUserTie, FaBullseye } from 'react-icons/fa';
import { FiDownload, FiHome } from 'react-icons/fi';

// CSS Module
import styles from './BottomMenu.module.css';

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');

  const menuItems = [
    {
      id: 'transactions',
      icon: <FiDownload />,
      label: 'Caixa',
      path: '/transaction',
      color: '#00E0FF' // Azul Neon (Cyber)
    },
    {
      id: 'dashboard',
      icon: <FiHome />,
      label: 'Dashboard',
      path: '/dashboard',
      color: '#00FF88' // Verde Neon (Win)
    },
    {
      id: 'objectives',
      icon: <FaBullseye />,
      label: 'Metas',
      path: '/objectives',
      color: '#FF0055' // Rosa Neon (Impacto)
    },
    {
      id: 'investment',
      icon: <FaUserTie />,
      label: 'Perfil de Investidor',
      path: '/investment-profile',
      color: '#D4AF37' // Dourado (Premium)
    }
  ];

  const handleNavigation = (path, id) => {
    setActiveItem(id);
    navigate(path);
    
    // Reset do efeito de pulso
    setTimeout(() => setActiveItem(''), 300);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={styles.bottomMenuContainer}>
      {/* Luz de fundo geral */}
      <div className={styles.neonGlow}></div>
      
      <nav className={styles.bottomMenu}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''} ${activeItem === item.id ? styles.pulse : ''}`}
            onClick={() => handleNavigation(item.path, item.id)}
            style={{
              '--item-color': item.color,
              '--item-glow': `${item.color}60` // Adiciona transparência à cor base para o glow
            }}
          >
            {/* Luz atrás do ícone ativo */}
            <div className={styles.activeGlow}></div>
            
            {/* Ícone */}
            <div className={styles.iconContainer}>
              {item.icon}
            </div>
            
            {/* Texto do menu */}
            <span className={styles.menuLabel}>{item.label}</span>
            
            {/* Indicador na borda inferior */}
            <div className={styles.activeIndicator}></div>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomMenu;