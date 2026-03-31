"use client";

import React, { createContext, useContext, useState } from "react";

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

interface ConfirmContextType {
  showConfirm: (options: ConfirmDialogOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);

  const showConfirm = (options: ConfirmDialogOptions) => {
    setDialog(options);
  };

  const handleConfirm = () => {
    dialog?.onConfirm();
    setDialog(null);
  };

  const handleCancel = () => {
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001] p-4">
          <div className="bg-base-200 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {dialog.title && (
              <h3 className="text-xl font-bold text-base-content">{dialog.title}</h3>
            )}
            <p className="text-base-content/80">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-base-300 hover:bg-base-100 text-base-content rounded-lg font-medium transition-colors"
              >
                {dialog.cancelText || "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                {dialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
