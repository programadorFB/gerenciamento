import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';

// --- Components ---
import ObjectiveModal from '../../components/ObjectiveModal';
import ObjectivesList from '../../components/ObjectivesList';

// --- Icons ---
import { MdArrowBack, MdAdd } from 'react-icons/md';
import { FaBullseye, FaTrophy } from 'react-icons/fa';

// --- CSS Module ---
import styles from './ObjectiveScreen.module.css';

const ObjectivesScreen = () => {
  const navigate = useNavigate();
  const { addObjective } = useFinancial();
  const [objectiveModalVisible, setObjectiveModalVisible] = useState(false);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('active'); // 'active' ou 'completed'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> <span>Voltar</span>
        </button>
        <h1>Missões & Metas</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* Sistema de Abas (Chips) */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <FaBullseye />
          <span>Em Jogo</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <FaTrophy />
          <span>Conquistados</span>
        </button>
      </div>

      <main className={styles.content}>
        {/* Botão de Ação Principal (Só na aba ativa) */}
        {activeTab === 'active' && (
          <button className={styles.addObjectiveButton} onClick={() => setObjectiveModalVisible(true)}>
            <MdAdd size={20} /> DEFINIR NOVO OBJETIVO
          </button>
        )}
        
        {/* Lista de Objetivos (Container interno estilizado pelo componente filho, 
            mas o pai controla o layout geral) */}
        <div style={{ width: '100%', maxWidth: '800px' }}>
            <ObjectivesList showCompleted={activeTab === 'completed'} />
        </div>
      </main>

      <ObjectiveModal 
        visible={objectiveModalVisible} 
        onClose={() => setObjectiveModalVisible(false)} 
      />
    </div>
  );
};

export default ObjectivesScreen;