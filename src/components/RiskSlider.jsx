import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { MdShield, MdSecurity, MdWhatshot } from 'react-icons/md';
import styles from './RiskSlider.module.css';

// --- CONFIGURAÇÃO DE PERFIS (ELITE THEME) ---
const PROFILES = [
  {
    maxValue: 3,
    title: 'Conservador',
    description: 'Prioridade total na proteção de capital. Ganhos consistentes e seguros.',
    icon: 'shield',
    color: '#2E7D32', // Esmeralda Escura
    gradient: ['#66BB6A', '#2E7D32'], 
  },
  {
    maxValue: 7,
    title: 'Moderado',
    description: 'Equilíbrio tático entre risco e retorno. Estratégia de crescimento.',
    icon: 'security',
    color: '#D4AF37', // Ouro
    gradient: ['#FEE184', '#D4AF37'],
  },
  {
    maxValue: 10,
    title: 'Agressivo',
    description: 'Alta volatilidade para maximizar lucros. Risco elevado aceito.',
    icon: 'fire',
    color: '#8B0000', // Sangue
    gradient: ['#FF5252', '#8B0000'],
  },
];

const getProfileForValue = (value) => {
  if (value <= 3) return PROFILES[0];
  if (value <= 7) return PROFILES[1];
  return PROFILES[2];
};

// Hook para medir largura do elemento
const useResizeObserver = (ref) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setWidth(entries[0].contentRect.width);
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
  const sliderWidth = useResizeObserver(trackRef);
  const [isDragging, setIsDragging] = useState(false);

  const controls = useAnimation();
  const x = useMotionValue(0);
  const knobRadius = 16; // Tamanho visual do knob (metade da largura)

  // Cálculos de Posição <-> Valor
  const calculateValueFromX = useCallback((currentX) => {
    if (sliderWidth === 0) return min;
    const effectiveWidth = sliderWidth;
    const boundedX = Math.max(0, Math.min(currentX, effectiveWidth));
    const percent = boundedX / effectiveWidth;
    const newValue = Math.round(percent * (max - min) + min);
    return newValue;
  }, [sliderWidth, min, max]);
  
  const calculateXFromValue = useCallback((val) => {
    if (sliderWidth > 0) {
      const percent = (val - min) / (max - min);
      return percent * sliderWidth;
    }
    return 0;
  }, [sliderWidth, min, max]);

  // Sincroniza posição X quando o valor muda externamente
  useEffect(() => {
    if (!isDragging && sliderWidth > 0) {
      const newX = calculateXFromValue(value);
      x.set(newX);
    }
  }, [value, sliderWidth, isDragging, calculateXFromValue, x]);

  const fillWidth = useTransform(x, (currentX) => `${(currentX / sliderWidth) * 100}%`);
  const currentProfile = useMemo(() => getProfileForValue(value), [value]);
  const { color, gradient, icon, title, description } = currentProfile;

  // Handlers de Drag
  const handleDragStart = () => {
    setIsDragging(true);
    controls.start({ scale: 1.1, cursor: 'grabbing' });
  };

  const handleDrag = () => {
    const newValue = calculateValueFromX(x.get());
    if (newValue !== value) {
      onValueChange(newValue);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalValue = calculateValueFromX(x.get());
    const snapX = calculateXFromValue(finalValue);
    
    controls.start({ 
      x: snapX, 
      scale: 1, 
      cursor: 'grab',
      transition: { type: 'spring', stiffness: 400, damping: 25 } 
    });
    
    onValueChange(finalValue);
  };

  const handleTrackClick = (event) => {
    if (isDragging) return;
    if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        
        const newValue = calculateValueFromX(clickX);
        onValueChange(newValue);
        
        const newX = calculateXFromValue(newValue);
        controls.start({ x: newX });
    }
  };

  return (
    <div className={`${styles.sliderContainer} ${compact ? styles.compactContainer : ''}`} style={containerStyle}>
      
      {/* Cabeçalho com Status */}
      <SliderHeader compact={compact} profile={currentProfile} value={value} />

      {/* Área do Slider */}
      <div className={`${styles.sliderWrapper} ${compact ? styles.compactSliderWrapper : ''}`}>
        
        {/* HUD Flutuante (Tooltip) */}
        <motion.div className={styles.floatingIconAnchor} style={{ x }}>
           <div className={styles.tooltipContainer}>
              <div 
                className={styles.tooltipBox} 
                style={{ 
                  borderColor: color, 
                  boxShadow: `0 0 15px ${color}30` 
                }}
              >
                 <span className={styles.tooltipValue} style={{ color }}>{value}</span>
              </div>
              <div className={styles.tooltipArrow} style={{ borderTopColor: color }} />
           </div>
        </motion.div>

        {/* Trilha e Preenchimento */}
        <div ref={trackRef} className={styles.sliderTrack} onClick={handleTrackClick}>
          {/* Fundo do Trilho */}
          <div className={styles.trackBackground} />
          
          {/* Preenchimento Colorido */}
          <motion.div 
            className={styles.sliderTrackFill} 
            style={{ 
              width: fillWidth, 
              background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
              boxShadow: `0 0 10px ${color}50`
            }} 
          />
          
          {/* Knob Físico */}
          <motion.div
            className={styles.sliderKnob}
            style={{ x }} // X é controlado pelo framer-motion
            drag="x"
            dragConstraints={trackRef}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={controls}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={styles.knobInner}>
               <div className={styles.knobIndicator} style={{ backgroundColor: color }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Régua de Números */}
      <ScaleNumbers 
         value={value} 
         onValueChange={onValueChange} 
         min={min} 
         max={max} 
         compact={compact} 
         activeColor={color} 
      />

      {/* Descrição Dinâmica */}
      {!compact && (
         <div className={styles.descriptionContainer} style={{ borderLeftColor: color }}>
            <p className={styles.descriptionText}>{description}</p>
         </div>
      )}
    </div>
  );
};

// --- Sub-componentes ---

const SliderHeader = ({ compact, profile, value }) => (
  <div className={styles.header}>
    <div className={styles.headerLeft}>
       <div className={styles.headerIconWrapper} style={{ color: profile.color, borderColor: profile.color }}>
          <IconComponent iconName={profile.icon} size={14} />
       </div>
       <span className={styles.headerTitle}>{compact ? "Risco" : "Perfil de Risco"}</span>
    </div>
    
    <div className={styles.statusBadge} style={{ color: profile.color, borderColor: profile.color }}>
       {profile.title}
    </div>
  </div>
);

const ScaleNumbers = ({ value, onValueChange, min, max, compact, activeColor }) => (
  <div className={styles.scaleContainer}>
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(i => (
      <div 
         key={i} 
         className={styles.scaleItem} 
         onClick={() => onValueChange(i)}
      >
         {/* Marcador Vertical */}
         <div 
            className={styles.scaleMark} 
            style={{ 
               backgroundColor: Math.round(value) === i ? activeColor : '#333',
               height: i % 5 === 0 ? '8px' : '4px' 
            }} 
         />
         {/* Número (apenas pares ou extremos para limpar o visual se for compacto) */}
         {(!compact || i % 2 === 0 || i === max) && (
            <span 
               className={styles.scaleNumber}
               style={{ 
                  color: Math.round(value) === i ? activeColor : '#444',
                  fontWeight: Math.round(value) === i ? '700' : '400'
               }}
            >
               {i}
            </span>
         )}
      </div>
    ))}
  </div>
);

const IconComponent = ({ iconName, size, ...props }) => {
  if (iconName === 'shield') return <MdShield size={size} {...props} />;
  if (iconName === 'security') return <MdSecurity size={size} {...props} />;
  if (iconName === 'fire') return <MdWhatshot size={size} {...props} />;
  return null;
};

export default RiskSlider;