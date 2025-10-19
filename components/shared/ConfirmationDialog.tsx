import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'حذف',
  cancelText = 'إلغاء',
  confirmColor = 'bg-red-600 hover:bg-red-700',
}) => {
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
         <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        `}</style>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="mt-2 text-slate-600">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">
            {cancelText}
          </button>
          <button onClick={handleConfirmClick} className={`py-2 px-4 text-white rounded-md ${confirmColor}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
