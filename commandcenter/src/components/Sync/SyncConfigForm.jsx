import React, { useState, useEffect } from 'react';
import SpringBootApi from '../../services/springBootApi';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, AlertCircle, Shield } from 'lucide-react';

// Create a single instance of the Spring Boot API
const springBootApi = new SpringBootApi();

// Custom event for config updates
export const CONFIG_UPDATED_EVENT = 'configUpdated';

export function SyncConfigForm() {
  const { t } = useTranslation();
  const [config, setConfig] = useState({
    sourceBaseUrl: '',
    sourceTokenId: '',
    sourceTokenSecret: '',
    destinationBaseUrl: '',
    destinationTokenId: '',
    destinationTokenSecret: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState({
    type: null,
    text: '',
  });

  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      const savedConfig = await springBootApi.getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setMessage({ type: null, text: '' });
    
    try {
      await springBootApi.saveConfig(config);
      
      // Dispatch a custom event to notify other components that config has been updated
      window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT));
      
      setMessage({
        type: 'success',
        text: t('configuration.configSaved'),
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('configuration.configSaveFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyCredentials = async () => {
    setIsVerifying(true);
    setMessage({ type: null, text: '' });
    
    try {
      const result = await springBootApi.verifyCredentials();
      
      const sourceStatus = result.sourceCredentialsValid ? t('configuration.valid') : t('configuration.invalid');
      const destStatus = result.destinationCredentialsValid ? t('configuration.valid') : t('configuration.invalid');
      
      setMessage({
        type: 'success',
        text: `${t('configuration.sourceCredentials')}: ${sourceStatus}${
          result.destinationCredentialsValid !== undefined 
            ? `\n${t('configuration.destinationCredentials')}: ${destStatus}`
            : ''
        }`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('configuration.verifyFailed'),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Shield size={20} style={{ color: '#818cf8' }} />
          {t('configuration.title')}
        </h2>
        <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t('configuration.subTitle')}
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        margin: '24px 32px 0',
        padding: '16px 20px',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
        color: '#818cf8',
        fontSize: '13px',
        lineHeight: '1.5',
      }}>
        <strong>{t('configuration.bannerNote')}:</strong> {t('configuration.bannerText')}
      </div>

      {/* Message */}
      {message.type && (
        <div style={{
          margin: '16px 32px 0',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          backgroundColor: message.type === 'success' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' 
            ? 'rgba(16, 185, 129, 0.3)' 
            : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
        }}>
          {message.type === 'success' 
            ? <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          }
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            {message.text.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}>
          {/* Source Settings */}
          <div style={{
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#818cf8',
              margin: '0 0 20px 0',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              {t('configuration.sourceSettings')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{t('configuration.sourceUrl')}</label>
                <input
                  type="text"
                  value={config.sourceBaseUrl}
                  onChange={(e) => handleChange('sourceBaseUrl', e.target.value)}
                  style={inputStyle}
                  placeholder="https://source-bookstack.example.com"
                />
              </div>
              <div>
                <label style={labelStyle}>{t('configuration.sourceApiToken')}</label>
                <input
                  type="text"
                  value={config.sourceTokenId}
                  onChange={(e) => handleChange('sourceTokenId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter source API token ID"
                />
              </div>
              <div>
                <label style={labelStyle}>{t('configuration.sourceToken')}</label>
                <input
                  type="password"
                  value={config.sourceTokenSecret}
                  onChange={(e) => handleChange('sourceTokenSecret', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter source API token"
                />
              </div>
            </div>
          </div>

          {/* Destination Settings */}
          <div style={{
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#ec4899',
              margin: '0 0 20px 0',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              {t('configuration.destinationSettings')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{t('configuration.destinationUrl')}</label>
                <input
                  type="text"
                  value={config.destinationBaseUrl}
                  onChange={(e) => handleChange('destinationBaseUrl', e.target.value)}
                  style={inputStyle}
                  placeholder="https://destination-bookstack.example.com"
                />
              </div>
              <div>
                <label style={labelStyle}>{t('configuration.destinationApiToken')}</label>
                <input
                  type="text"
                  value={config.destinationTokenId}
                  onChange={(e) => handleChange('destinationTokenId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter destination API token ID"
                />
              </div>
              <div>
                <label style={labelStyle}>{t('configuration.destinationToken')}</label>
                <input
                  type="password"
                  value={config.destinationTokenSecret}
                  onChange={(e) => handleChange('destinationTokenSecret', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter destination API token"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Save size={16} />
            {isSaving ? t('configuration.saving') : t('configuration.saveConfig')}
          </button>
          <button
            onClick={verifyCredentials}
            disabled={isVerifying}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isVerifying ? 'not-allowed' : 'pointer',
              opacity: isVerifying ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Shield size={16} />
            {isVerifying ? t('configuration.verifying') : t('configuration.verifyCredentials')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncConfigForm;
