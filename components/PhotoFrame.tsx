import React from 'react';
import { ImageIcon } from 'lucide-react';
import SmartImage from './SmartImage';

interface Props {
  src: string;
  alt: string;
  /** Підпис у заглушці, поки фото не додане. */
  caption?: string;
  className?: string;
  /** Співвідношення сторін рамки, напр. 'aspect-[4/5]' або 'aspect-video'. */
  ratio?: string;
}

/**
 * Гарна рамка під фото. Поки файлу нема - показує охайну заглушку
 * з підказкою, тож сторінка ніколи не виглядає «зламаною».
 */
const PhotoFrame: React.FC<Props> = ({ src, alt, caption, className = '', ratio = 'aspect-[4/5]' }) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl ring-1 ring-white/60 shadow-xl shadow-emerald-900/10 ${ratio} ${className}`}>
      <SmartImage
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 text-emerald-700/70">
            <ImageIcon className="h-9 w-9" />
            <span className="px-4 text-center text-xs font-semibold uppercase tracking-wide">
              {caption || 'Фото скоро з\'явиться'}
            </span>
          </div>
        }
      />
    </div>
  );
};

export default PhotoFrame;
