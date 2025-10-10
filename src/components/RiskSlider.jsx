import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { FaShieldAlt, FaBalanceScale, FaFire } from 'react-icons/fa';
import styles from './RiskSlider.module.css';

// Configuração centralizada dos perfis (mesma do código refatorado)
// Substitua o seu array PROFILES vazio por este:
const PROFILES = [
  {
    maxValue: 3,
    title: 'Perfil Conservador',
    description: 'Prioriza a segurança e a preservação do capital.',
    icon: 'shield-alt',
    color: '#39db34ff', // Azul
    gradient: ['#80ff74ff', '#42db34ff'],
  },
  {
    maxValue: 7,
    title: 'Perfil Moderado',
    description: 'Busca um equilíbrio entre segurança e rentabilidade.',
    icon: 'balance-scale',
    color: '#f1c40f', // Amarelo
    gradient: ['#f5de7a', '#f1c40f'],
  },
  {
    maxValue: 10,
    title: 'Perfil Agressivo',
    description: 'Foco em maximizar ganhos, aceitando maior volatilidade.',
    icon: 'fire',
    color: '#e74c3c', // Vermelho
    gradient: ['#ff8a80', '#e74c3c'],
  },
];

const getProfileForValue = (value) => {
  return PROFILES.find((p) => value <= p.maxValue);
};

const RiskSlider = ({ value, onValueChange, compact = false, containerStyle = {} }) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const knobSize = 40; // O knob é maior na web para facilitar o clique
  const trackRef = useRef(null);

  const controls = useAnimation();
  const x = useMotionValue((value / 10) * sliderWidth);
  
  // Mapeia a posição X do knob para a largura da barra de preenchimento
  const fillWidth = useTransform(x, [0, sliderWidth], ['0%', '100%']);
  
  const currentProfile = useMemo(() => getProfileForValue(value), [value]);
  const { color, gradient, icon, title, description } = currentProfile;

  // Atualiza a largura do slider quando o componente é montado/redimensionado
  useEffect(() => {
    const updateSliderWidth = () => {
      if (trackRef.current) {
        setSliderWidth(trackRef.current.offsetWidth);
      }
    };
    updateSliderWidth();
    window.addEventListener('resize', updateSliderWidth);
    return () => window.removeEventListener('resize', updateSliderWidth);
  }, []);

  // Sincroniza o valor externo com a posição X interna
  useEffect(() => {
    if (sliderWidth > 0) {
      x.set((value / 10) * sliderWidth);
    }
  }, [value, sliderWidth, x]);
  
  const handleDrag = () => {
    const newSliderValue = Math.round((x.get() / sliderWidth) * 10);
    if (newSliderValue !== value) {
      onValueChange(newSliderValue);
    }
  };

  const handleDragStart = () => {
    controls.start({ scale: 1.3, y: -5 });
  };

  const handleDragEnd = () => {
    const finalValue = Math.round((x.get() / sliderWidth) * 10);
    const newX = (finalValue / 10) * sliderWidth;
    x.set(newX); // Trava na posição final
    controls.start({ scale: 1, y: 0 });
  };
  
  return (
    <div className={`${styles.sliderContainer} ${compact ? styles.compactContainer : ''}`} style={containerStyle}>
      <SliderHeader compact={compact} profile={currentProfile} />
      {!compact && <SliderLabels value={value} />}

      <div className={`${styles.sliderWrapper} ${compact ? styles.compactSliderWrapper : ''}`}>
        {/* Ícone flutuante que acompanha o knob */}
        <motion.div
          className={styles.floatingIconWrapper}
          style={{ x }}
          animate={controls}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        >
          <div className={styles.iconBubble} style={{ borderColor: color, boxShadow: `0 4px 15px ${color}55` }}>
            <IconComponent iconName={icon} size={compact ? 14 : 18} />
            <span className={styles.iconValue} style={{ color }}>{value}</span>
          </div>
          <div className={styles.iconArrow} style={{ borderTopColor: color }} />
        </motion.div>

        {/* Trilha do slider */}
        <div ref={trackRef} className={styles.sliderTrack}>
          <motion.div className={styles.sliderTrackFill} style={{ width: fillWidth, background: `linear-gradient(to right, ${gradient[0]}, ${gradient[1]})` }} />
          
          {/* Knob arrastável */}
          <motion.div
            className={styles.sliderKnob}
            style={{ x }}
            drag="x"
            dragConstraints={trackRef}
            dragElastic={0.1}
            onDrag={handleDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={controls}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          >
            <div className={styles.knobCenter} style={{ background: color }} />
          </motion.div>
        </div>
      </div>

      <ScaleNumbers value={value} onValueChange={onValueChange} compact={compact} />
      {compact && <p className={styles.compactDescriptionText}>{description}</p>}
    </div>
  );
};

// --- Sub-componentes ---
const SliderHeader = ({ compact, profile }) => (
  <div className={compact ? styles.compactHeader : styles.sliderHeader}>
    <h3 className={compact ? styles.compactTitle : styles.sliderTitle}>
      {compact ? "Perfil de Risco" : "Nível de Tolerância ao Risco"}
    </h3>
    <div className={compact ? styles.compactProfileDisplay : styles.currentProfileIndicator}>
      <IconComponent iconName={profile.icon} size={compact ? 16 : 20} color={profile.color} />
      <span style={{ color: profile.color }}>{profile.title}</span>
    </div>
  </div>
);

const SliderLabels = ({ value }) => (
  <div className={styles.sliderLabels}>
    {PROFILES.map((profile) => {
      const isActive = getProfileForValue(value).title === profile.title;
      return (
        <div key={profile.title} className={styles.labelContainer}>
          <IconComponent iconName={profile.icon} size={18} color={isActive ? profile.color : '#666'} />
          <span className={`${styles.sliderLabel} ${isActive ? styles.activeLabel : ''}`}>
            {profile.title.split(' ')[2]}
          </span>
        </div>
      );
    })}
  </div>
);

const ScaleNumbers = ({ value, onValueChange, compact }) => (
  <div className={`${styles.scaleNumbers} ${compact ? styles.compactScaleNumbers : ''}`}>
    {Array.from({ length: 11 }, (_, i) => (
      <button
        key={i}
        className={`${styles.scaleNumber} ${Math.round(value) === i ? styles.activeScaleNumber : ''} ${compact ? styles.compactScaleNumber : ''}`}
        onClick={() => onValueChange(i)}
      >
        {i}
      </button>
    ))}
  </div>
);

// Componente helper para renderizar o ícone correto
const IconComponent = ({ iconName, ...props }) => {
  if (iconName === 'shield-alt') return <FaShieldAlt {...props} />;
  if (iconName === 'balance-scale') return <FaBalanceScale {...props} />;
  if (iconName === 'fire') return <FaFire {...props} />;
  return null;
};

export default RiskSlider;