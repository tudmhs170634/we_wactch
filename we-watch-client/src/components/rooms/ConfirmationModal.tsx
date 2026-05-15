'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'info',
}) => {
  if (!isOpen) return null;

  const colorClass = type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-[#C800DF]';
  const shadowClass = type === 'danger' ? 'shadow-red-500/20' : type === 'warning' ? 'shadow-yellow-500/20' : 'shadow-[#C800DF]/20';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#12121A] p-6 shadow-2xl ${shadowClass}`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}/20`}>
              <AlertCircle className={`h-6 w-6 ${type === 'danger' ? 'text-red-500' : type === 'warning' ? 'text-yellow-500' : 'text-[#C800DF]'}`} />
            </div>

            <h3 className="mb-2 text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            
            <p className="mb-6 text-sm leading-relaxed text-white/60">
              {message}
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl bg-white/5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 ${colorClass}`}
              >
                {confirmText}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/20 transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
