import React, { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

interface Props {
  value: number;
  className?: string;
}

/** Плавно «докручує» число при зміні значення. */
const AnimatedNumber: React.FC<Props> = ({ value, className }) => {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, mv]);

  return <span className={className}>{display.toLocaleString('uk-UA')}</span>;
};

export default AnimatedNumber;
