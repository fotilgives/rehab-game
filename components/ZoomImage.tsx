import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Expand, ImageIcon } from 'lucide-react';
import SmartImage from './SmartImage';

interface Props {
  src: string;
  alt: string;
  /** Підпис у заглушці, поки фото не додане. */
  caption?: string;
  className?: string;
  /** Співвідношення сторін рамки, напр. 'aspect-[3/4]'. */
  ratio?: string;
}

/**
 * Вертикальна картка-фото. Тап / клік відкриває повне фото на весь екран.
 * Поки файлу нема - показує охайну заглушку.
 */
const ZoomImage: React.FC<Props> = ({ src, alt, caption, className = '', ratio = 'aspect-[3/4]' }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Відкрити фото: ${alt}`}
        className={`group relative block w-full overflow-hidden rounded-3xl bg-white ring-1 ring-emerald-100 shadow-xl shadow-emerald-900/10 ${ratio} ${className}`}
      >
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
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition group-hover:bg-slate-900/85 sm:opacity-0 sm:group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" /> Відкрити
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
            >
              <button
                type="button"
                aria-label="Закрити"
                className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
              <motion.img
                src={src}
                alt={alt}
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.92 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default ZoomImage;
