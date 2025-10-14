import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importar o hook de navegação
import { useFinancial } from '../../contexts/FinancialContext';

// --- Components ---
import ObjectiveModal from '../../components/ObjectiveModal';
import ObjectivesList from '../../components/ObjectivesList';

// --- Icons ---
import { IoArrowBack } from 'react-icons/io5'; // 2. Importar o ícone de voltar

// --- CSS Module ---
import styles from './ObjectiveScreen.module.css';

const ObjectivesScreen = () => {
  const navigate = useNavigate(); // 3. Inicializar o hook
  const { addObjective, objectives, updateObjective, deleteObjective } = useFinancial();
  const [objectiveModalVisible, setObjectiveModalVisible] = useState(false);

  return (
    // 4. Adicionada a estrutura principal da tela
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <IoArrowBack /> Voltar
        </button>
        <h1>Meus Objetivos</h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        <button className={styles.addObjectiveButton} onClick={() => setObjectiveModalVisible(true)}>
          Criar Novo Objetivo
        </button>
        
        <ObjectivesList 
          objectives={objectives} 
          onUpdateObjective={updateObjective} 
          onDeleteObjective={deleteObjective} 
        />
      </main>

      <ObjectiveModal 
        visible={objectiveModalVisible} 
        onClose={() => setObjectiveModalVisible(false)} 
        onSave={addObjective} 
      />
    </div>
  );
};

export default ObjectivesScreen;