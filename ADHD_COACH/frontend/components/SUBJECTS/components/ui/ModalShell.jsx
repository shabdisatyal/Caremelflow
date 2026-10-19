import { useEffect } from 'react';
import { OVERLAY_COLOR } from '../constants';

export default function ModalShell({ label, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: OVERLAY_COLOR }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#FFFAF3] p-6 shadow-xl sm:p-8"
      >
        {children}
      </div>
    </div>
  );
}
