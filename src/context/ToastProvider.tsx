import React, { useState, useCallback, ReactNode, useRef } from 'react';
import { ToastContext, ToastOptions, ConfirmOptions } from './ToastContext';
import Toast from '../components/common/Toast';
import ConfirmationModal, { ConfirmationType } from '../components/common/ConfirmationModal';

interface ToastProviderProps {
  children: ReactNode;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<ToastOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const hideToast = useCallback(() => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToastConfig(options);
      setIsVisible(true);

      // Auto-hide after duration (default 4000ms)
      const duration = options.duration ?? 4000;
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [hideToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast({ type: 'success', message, duration });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast({ type: 'error', message, duration });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast({ type: 'info', message, duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast({ type: 'warning', message, duration });
    },
    [showToast]
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const alert = useCallback(
    (title: string, message: string, type: ConfirmationType = 'info'): Promise<void> => {
      return new Promise((resolve) => {
        setConfirmState({
          title,
          message,
          type,
          confirmText: 'OK',
          showCancel: false,
          resolve: () => resolve(),
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  }, [confirmState]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        warning,
        hideToast,
        confirm,
        alert,
      }}
    >
      {children}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          visible={isVisible}
          onHide={hideToast}
          action={toastConfig.action}
        />
      )}
      <ConfirmationModal
        visible={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        type={confirmState?.type}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        showCancel={confirmState?.showCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
};
