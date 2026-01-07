import type { ReactNode } from 'react';


interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        {title && (
          <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        )}

        {children}
      </div>
    </div>
  );
}
