import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  // Theme-aware styles using CSS variables
  const styles = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 9998,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.2s ease-out',
    },
    modal: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
      zIndex: 9999,
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg), 0 0 50px var(--color-primary-glow)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    header: {
      padding: '24px 32px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    },
    title: {
      color: 'var(--text-primary)',
      fontSize: '20px',
      fontWeight: '700',
      margin: 0,
      letterSpacing: '-0.02em',
    },
    closeButton: {
      background: 'var(--bg-surface-glass)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '8px',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      display: 'flex',
      transition: 'all 0.2s',
    },
    content: {
      padding: '32px',
      overflowY: 'auto',
      color: 'var(--text-primary)',
      lineHeight: '1.6',
    }
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
};

export default Modal;
