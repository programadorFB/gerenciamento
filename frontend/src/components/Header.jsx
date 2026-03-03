import React from 'react';
import { useSideMenu } from '../context/SideMenuContext'; // Ajuste o caminho
import { FaBars } from 'react-icons/fa';

const Header = ({ onMenuClick, userName }) => (
    <header>
      <button onClick={toggleMenu} aria-label="Abrir menu">
        <FaBars size={24} />
    </button>
    <div className="greeting">Olá, {userName}!</div>
    <div className="logo">💰</div>
  </header>
);

export default Header;