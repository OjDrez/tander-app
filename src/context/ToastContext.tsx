import React, { createContext, useContext } from 'react';
import { ConfirmationType } from '../components/common/ConfirmationModal';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  hideToast: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (title: string, message: string, type?: ConfirmationType) => Promise<void>;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
