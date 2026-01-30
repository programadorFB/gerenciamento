import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';

// --- Components ---
import ObjectiveModal from '../../components/ObjectiveModal';
import ObjectivesList from '../../components/ObjectivesList';

// --- Icons ---
import { MdArrowBack, MdAddCircleOutline } from 'react-icons/md';
import { GiDart, GiTrophyCup } from 'react-icons/gi'; 

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
          <MdArrowBack size={18} /> <span>VOLTAR</span>
        </button>
        <h1 className={styles.pageTitle}>MISSÕES DA BANCA</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* Navegação tipo "Mesa de Jogo" (Chips) */}
      <div className={styles.tableControls}>
        <div className={styles.chipToggleContainer}>
          <button 
            className={`${styles.chipTab} ${activeTab === 'active' ? styles.chipActiveGold : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <GiDart className={styles.tabIcon} />
            <span className={styles.tabText}>EM JOGO</span>
          </button>
          
          <button 
            className={`${styles.chipTab} ${activeTab === 'completed' ? styles.chipActiveGreen : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <GiTrophyCup className={styles.tabIcon} />
            <span className={styles.tabText}>CONQUISTAS</span>
          </button>
        </div>
      </div>

      <main className={styles.contentTable}>
        {/* Botão de Ação Principal (Só na aba ativa) */}
        {activeTab === 'active' && (
          <button className={styles.addBetButton} onClick={() => setObjectiveModalVisible(true)}>
            <MdAddCircleOutline size={22} />
            <span>NOVA META</span>
          </button>
        )}
        
        {/* Lista de Objetivos */}
        <div className={styles.listWrapper}>
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