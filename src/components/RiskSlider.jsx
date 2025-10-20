import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { FaShieldAlt, FaBalanceScale, FaFire } from 'react-icons/fa';
import styles from './RiskSlider.module.css';

// Configuração centralizada dos perfis
const PROFILES = [
  {
    maxValue: 3,
    title: 'Perfil Conservador',
    description: 'Prioriza a segurança e a preservação do capital.',
    icon: 'shield-alt',
    color: '#39db34ff',
    gradient: ['#80ff74ff', '#42db34ff'],
  },
  {
    maxValue: 7,
    title: 'Perfil Moderado',
    description: 'Busca um equilíbrio entre segurança e rentabilidade.',
    icon: 'balance-scale',
    color: '#f1c40f',
    gradient: ['#f5de7a', '#f1c40f'],
  },
  {
    maxValue: 10,
    title: 'Perfil Agressivo',
    description: 'Foco em maximizar ganhos, aceitando maior volatilidade.',
    icon: 'fire',
    color: '#e74c3c',
    gradient: ['#ff8a80', '#e74c3c'],
  },
];

// Função utilitária para encontrar o perfil com base no valor
const getProfileForValue = (value) => {
  if (value <= 3) {
    return PROFILES[0]; // Conservador
  } else if (value <= 6) {
    return PROFILES[1]; // Moderado
  } else {
    return PROFILES[2]; // Agressivo
  }
};


// Custom hook para observar o tamanho de um elemento de forma performática.
const useResizeObserver = (ref) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [ref]);
  return width;
};


const RiskSlider = ({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 10, 
  compact = false, 
  containerStyle = {} 
}) => {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const sliderWidth = useResizeObserver(trackRef);

  const controls = useAnimation();
  const x = useMotionValue(0);

  // Função para calcular o valor com base na posição X.
  const calculateValueFromX = useCallback((newX) => {
    const knobRadius = 20; // Metade da largura do knob (40px / 2)
    const effectiveWidth = sliderWidth - (knobRadius * 2);
    const adjustedX = newX - knobRadius;
    const boundedX = Math.max(0, Math.min(adjustedX, effectiveWidth));
    const newValue = Math.round((boundedX / effectiveWidth) * (max - min) + min);
    return newValue;
  }, [sliderWidth, min, max]);
  
  // Função para atualizar a posição X com base no valor recebido via props.
  const updateXFromValue = useCallback((val) => {
    if (sliderWidth > 0) {
      const knobRadius = 20;
      const effectiveWidth = sliderWidth - (knobRadius * 2);
      const newX = ((val - min) / (max - min)) * effectiveWidth + knobRadius;
      x.set(newX);
    }
  }, [sliderWidth, min, max, x]);

  // Sincroniza a posição do knob quando o 'value' externo muda
  useEffect(() => {
    updateXFromValue(value);
  }, [value, updateXFromValue]);

  // Mapeia a posição X do knob para a largura da barra de preenchimento
  const fillWidth = useTransform(x, [0, sliderWidth], ['0%', '100%']);
  
  // Calcula o perfil atual com base no valor
  const currentProfile = useMemo(() => getProfileForValue(value), [value]);
  const { color, gradient, icon, title, description } = currentProfile;

  // Função chamada continuamente enquanto o knob é arrastado
  const handleDrag = () => {
    const newSliderValue = calculateValueFromX(x.get());
    if (newSliderValue !== value) {
      onValueChange(newSliderValue);
    }
  };

  // Função chamada ao soltar o knob
  const handleDragEnd = () => {
    const finalValue = calculateValueFromX(x.get());
    updateXFromValue(finalValue); // Trava o knob na posição exata do valor final
    controls.start({ scale: 1, y: 0 }); // Retorna o knob ao tamanho normal
  };

  // Função chamada ao começar a arrastar o knob
  const handleDragStart = () => {
    controls.start({ scale: 1.3, y: -5 }); // Aumenta o knob para feedback visual
  };

  // Função que permite clicar na trilha para definir o valor
  const handleTrackClick = (event) => {
    if (trackRef.current) {
        knobRef.current?.focus(); // Foca no knob para acessibilidade
        const rect = trackRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const newValue = calculateValueFromX(clickX);
        onValueChange(newValue);
    }
  };

  // Adiciona navegação por teclado (Setas Direita/Esquerda)
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onValueChange(Math.min(value + 1, max));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onValueChange(Math.max(value - 1, min));
    }
  };
  
  return (
    <div className={`${styles.sliderContainer} ${compact ? styles.compactContainer : ''}`} style={containerStyle}>
      <SliderHeader compact={compact} profile={currentProfile} />
      {!compact && <SliderLabels value={value} />}

      <div className={`${styles.sliderWrapper} ${compact ? styles.compactSliderWrapper : ''}`}>
        {/* Âncora de posicionamento que segue o knob */}
        <motion.div
          className={styles.floatingIconAnchor}
          style={{ x }}
        >
          {/* O wrapper do ícone agora se centraliza dentro da âncora */}
          <div className={styles.floatingIconWrapper}>
            <div className={styles.iconBubble} style={{ borderColor: color, boxShadow: `0 4px 15px ${color}55` }}>
              <IconComponent iconName={icon} size={compact ? 14 : 18} />
              <span className={styles.iconValue} style={{ color }}>{value}</span>
            </div>
            <div className={styles.iconArrow} style={{ borderTopColor: color }} />
          </div>
        </motion.div>

        {/* Trilha do slider, agora clicável */}
        <div ref={trackRef} className={styles.sliderTrack} onClick={handleTrackClick}>
          {/* Preenchimento da trilha */}
          <motion.div className={styles.sliderTrackFill} style={{ width: fillWidth, background: `linear-gradient(to right, ${gradient[0]}, ${gradient[1]})` }} />
          
          {/* Knob arrastável e acessível */}
          <motion.div
            ref={knobRef}
            className={styles.sliderKnob}
            style={{ x }}
            drag="x"
            dragConstraints={trackRef}
            dragElastic={0.1}
            onDrag={handleDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onKeyDown={handleKeyDown}
            animate={controls}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            // Atributos de Acessibilidade (a11y)
            role="slider"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-label="Seletor de Nível de Risco"
            tabIndex={0} // Torna o knob focável via teclado
          >
            <div className={styles.knobCenter} style={{ background: color }} />
          </motion.div>
        </div>
      </div>

      <ScaleNumbers value={value} onValueChange={onValueChange} min={min} max={max} compact={compact} />
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

const ScaleNumbers = ({ value, onValueChange, min, max, compact }) => (
  <div className={`${styles.scaleNumbers} ${compact ? styles.compactScaleNumbers : ''}`}>
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(i => (
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