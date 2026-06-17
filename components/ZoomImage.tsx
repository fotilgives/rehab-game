import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const ZoomImage: React.FC<Props> = ({ src, alt, className = '' }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden focus:outline-none ${className}`}
        aria-label={`Відкрити фото: ${alt}`}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition duration-300 group-hover:opacity-100 group-hover:bg-white/20 backdrop-blur-sm">
            <ZoomIn className="h-5 w-5 drop-shadow" />
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-h-[92dvh] max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="h-auto w-full max-h-[92dvh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setOpen(false)}
                className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
                aria-label="Закрити"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ZoomImage;
