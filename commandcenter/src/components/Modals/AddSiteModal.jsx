import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Globe, Key, FileText, Link as LinkIcon, Lock, Sparkles } from 'lucide-react';
import { saveSite } from '../../services/apiService';

const AddSiteModal = ({ isOpen, onClose, onSiteAdded }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    slug: '',
    api_token: '',
    description: '',
    status: 'healthy'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await saveSite(formData);
      onSiteAdded();
      onClose();
      setFormData({ name: '', url: '', slug: '', api_token: '', description: '', status: 'healthy' });
    } catch (err) {
      setError(t('websites.addModal.errorSave'));
    } finally {
      setLoading(false);
    }
  };

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
      width: '100%',
      maxWidth: '560px',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: '20px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg), 0 0 50px var(--color-primary-glow)',
      overflow: 'hidden',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    header: {
      padding: '28px 32px 24px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      borderBottom: '1px solid var(--border-glass)',
      position: 'relative',
      overflow: 'hidden',
    },
    closeButton: {
      background: 'var(--bg-surface-glass)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '10px',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      display: 'flex',
      transition: 'all 0.2s',
    },
    label: {
      display: 'block',
      color: 'var(--text-primary)',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '10px',
    },
    input: {
      width: '100%',
      backgroundColor: 'var(--bg-app)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '16px 16px 16px 60px',
      color: 'var(--text-primary)',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.2s',
    },
    iconBadge: (color) => ({
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      backgroundColor: `rgba(${color}, 0.1)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    cancelButton: {
      padding: '12px 24px',
      borderRadius: '10px',
      border: '1px solid var(--border-color)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    submitButton: {
      padding: '12px 28px',
      borderRadius: '10px',
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
      transition: 'all 0.2s',
    },
  };

  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />
      
      {/* Modal */}
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '14px', 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              }}>
                <Globe size={24} color="white" />
              </div>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>
                  {t('websites.addModal.title')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '6px 0 0 0' }}>
                  {t('websites.addModal.subtitle')}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{ 
              padding: '14px 16px', 
              marginBottom: '24px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Site Name */}
            <div>
              <label style={styles.label}>{t('websites.addModal.fieldName')}</label>
              <div style={{ position: 'relative' }}>
                <div style={styles.iconBadge('99, 102, 241')}>
                  <Globe size={16} color="#818cf8" />
                </div>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('websites.addModal.namePlaceholder')}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {/* URL & Slug Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
              <div>
                <label style={styles.label}>{t('websites.addModal.fieldUrl')}</label>
                <div style={{ position: 'relative' }}>
                  <div style={styles.iconBadge('16, 185, 129')}>
                    <LinkIcon size={16} color="#34d399" />
                  </div>
                  <input 
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder={t('websites.addModal.urlPlaceholder')}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>{t('websites.addModal.fieldSlug')}</label>
                <div style={{ position: 'relative' }}>
                  <div style={styles.iconBadge('251, 191, 36')}>
                    <FileText size={16} color="#fbbf24" />
                  </div>
                  <input 
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder={t('websites.addModal.slugPlaceholder')}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* API Token */}
            <div>
              <label style={styles.label}>{t('websites.addModal.fieldApiToken')}</label>
              <div style={{ position: 'relative' }}>
                <div style={styles.iconBadge('236, 72, 153')}>
                  <Key size={16} color="#f472b6" />
                </div>
                <input 
                  name="api_token"
                  value={formData.api_token}
                  onChange={handleChange}
                  placeholder={t('websites.addModal.tokenPlaceholder')}
                  required
                  style={{ ...styles.input, fontFamily: 'monospace', fontSize: '14px' }}
                />
              </div>
              <p style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: 'var(--text-muted)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '8px',
                width: 'fit-content'
              }}>
                <Lock size={12} /> {t('websites.addModal.storageHint', { file: 'sites.yaml' })}
              </p>
            </div>

            {/* Description */}
            <div>
              <label style={styles.label}>
                {t('websites.addModal.fieldDescription')} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>{t('websites.addModal.optional')}</span>
              </label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder={t('websites.addModal.descPlaceholder')}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  resize: 'none',
                  outline: 'none',
                  transition: 'all 0.2s',
                  lineHeight: '1.5',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            marginTop: '32px', 
            paddingTop: '24px', 
            borderTop: '1px solid var(--border-glass)' 
          }}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              {t('websites.addModal.cancel')}
            </button>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? t('websites.addModal.saving') : <><Sparkles size={16} /> {t('websites.addModal.save')}</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddSiteModal;
