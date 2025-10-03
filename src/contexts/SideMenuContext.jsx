import React, { createContext, useContext, useState, useCallback } from 'react';

// 1. Criação do Contexto
const SideMenuContext = createContext(null);

// 2. Criação do Provedor (Provider)
export const SideMenuProvider = ({ children }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  // Funções para controlar o estado do menu
  // Usamos useCallback para evitar recriações desnecessárias das funções
  const toggleMenu = useCallback(() => {
    setMenuVisible(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  // O valor do contexto não inclui mais 'slideAnim',
  // pois a animação agora é feita via CSS no componente do menu.
  const value = {
    menuVisible,
    toggleMenu,
    closeMenu,
    openMenu,
  };

  return (
    <SideMenuContext.Provider value={value}>
      {children}
    </SideMenuContext.Provider>
  );
};

// 3. Hook customizado para consumir o contexto
export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
};