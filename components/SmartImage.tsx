import React, { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Показується, якщо фото ще не додане (404) або не завантажилось. */
  fallback?: React.ReactNode;
}

/**
 * Картинка з «м'якою» поведінкою: якщо файл ще не покладено в /public/images,
 * замість «битої» іконки показуємо охайну заглушку (fallback).
 * Щойно ви додасте реальний файл - він з'явиться автоматично.
 */
const SmartImage: React.FC<Props> = ({ src, alt, className, fallback = null }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default SmartImage;
