import { useEffect } from 'react';

export default function ModalShell({ label, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--bg)] p-6 shadow-xl sm:p-8"
      >
        {children}
      </div>
    </div>
  );
}