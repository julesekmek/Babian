import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface PriceTickerProps {
  value: number;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({ value }) => {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (latest) => 
    latest.toFixed(2)
  );

  return (
    <motion.span>{displayValue}</motion.span>
  );
};
