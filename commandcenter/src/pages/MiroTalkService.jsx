import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Video, 
  Plus, 
  Trash2, 
  Users, 
  Server, 
  Globe, 
  Clock,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Cpu,
  Activity
} from 'lucide-react';

const API_BASE = '';

// Status badge component
const StatusBadge = ({ status, t }) => {
  const statusConfig = {
    running: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', key: 'mirotalk.status.running' },
    provisioning: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', key: 'mirotalk.status.provisioning' },
    booting: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', key: 'mirotalk.status.booting' },
    destroying: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', key: 'mirotalk.status.destroying' },
    failed: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', key: 'mirotalk.status.failed' },
    destroy_failed: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', key: 'mirotalk.status.destroyFailed' }
  };

  const config = statusConfig[status] || { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', key: null };
  const label = config.key ? t(config.key) : status;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: config.bg,
      color: config.color
    }}>
      {status === 'provisioning' || status === 'booting' || status === 'destroying' ? (
        <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : status === 'running' ? (
        <CheckCircle2 size={12} />
      ) : status === 'failed' || status === 'destroy_failed' ? (
        <XCircle size={12} />
      ) : null}
      {label}
    </span>
  );
};

// Room card component
const RoomCard = ({ room, onDestroy, onRefresh, t }) => {
  const [copied, setCopied] = useState(false);

  const copyMeetingUrl = () => {
    if (room.meetingUrl) {
      navigator.clipboard.writeText(room.meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openMeeting = () => {
    if (room.meetingUrl) {
      window.open(room.meetingUrl, '_blank');
    }
  };

  return (
    <div style={{
      borderRadius: '20px',
      padding: '24px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: room.status === 'running' 
          ? 'linear-gradient(90deg, #10b981, #059669)'
          : room.status === 'booting'
          ? 'linear-gradient(90deg, #818cf8, #6366f1)'
          : room.status === 'provisioning' || room.status === 'destroying'
          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
          : 'linear-gradient(90deg, #ef4444, #dc2626)',
        opacity: 0.8
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0,
            marginBottom: '8px'
          }}>
            {room.name}
          </h3>
          <StatusBadge status={room.status} t={t} />
        </div>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <Video size={22} style={{ color: '#10b981' }} />
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{room.region || 'us-east'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={14} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{room.instanceType || 'g6-nanode-1'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={14} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{room.instanceIp || 'Pending...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            {room.createdAt ? new Date(room.createdAt).toLocaleString() : '-'}
          </span>
        </div>
      </div>

      {/* Live stats */}
      <div style={{
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Activity size={16} style={{ color: '#818cf8' }} />
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{t('mirotalk.room.activeRooms', { count: room.liveStats?.totalRooms || 0 })}</strong>, 
          <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{t('mirotalk.room.activeUsers', { count: room.liveStats?.totalPeers || 0 })}</strong>
        </span>
      </div>

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {room.status === 'running' && room.meetingUrl && (
          <>
            <button
              onClick={openMeeting}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ExternalLink size={14} />
              {t('mirotalk.actions.joinMeeting')}
            </button>
            <button
              onClick={copyMeetingUrl}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: copied ? '#10b981' : '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? t('mirotalk.actions.copied') : t('mirotalk.actions.copy')}
            </button>
          </>
        )}
        
        <button
          onClick={() => onRefresh(room.id)}
          title={t('mirotalk.actions.refresh')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={() => onDestroy(room.id)}
          disabled={room.status === 'destroying'}
          title={t('mirotalk.actions.destroy')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            cursor: room.status === 'destroying' ? 'not-allowed' : 'pointer',
            opacity: room.status === 'destroying' ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Error message */}
      {room.error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12px', color: '#fca5a5' }}>{room.error}</span>
        </div>
      )}
    </div>
  );
};

// Create room modal
const CreateRoomModal = ({ isOpen, onClose, onCreate, config, onSaveConfig, t }) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east');
  const [instanceType, setInstanceType] = useState('g6-nanode-1');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Configuration fields
  const [linodeToken, setLinodeToken] = useState(config?.linodeToken || '');
  const [apiKeySecret, setApiKeySecret] = useState(config?.apiKeySecret || '');
  const [configSaved, setConfigSaved] = useState(false);

  // Update local state when config changes
  useEffect(() => {
    if (config) {
      setLinodeToken(config.linodeToken || '');
      setApiKeySecret(config.apiKeySecret || '');
    }
  }, [config]);

  const handleSaveConfig = async () => {
    await onSaveConfig({
      linodeToken,
      apiKeySecret
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await onCreate({ name, region, instanceType });
      setName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const hasToken = config?.hasLinodeToken || linodeToken.length > 10;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        borderRadius: '24px',
        padding: '32px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: 'var(--text-primary)'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          margin: 0,
          marginBottom: '8px'
        }}>
          {t('mirotalk.modal.title')}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {t('mirotalk.modal.subtitle')}
        </p>

        {/* Settings Section (Collapsible) */}
        <div style={{
          marginBottom: '24px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(99, 102, 241, 0.1)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{t('mirotalk.modal.configTitle')}</span>
              {hasToken && (
                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
              )}
            </div>
            <span style={{ 
              transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--text-secondary)'
            }}>▼</span>
          </button>

          {showSettings && (
            <div style={{ padding: '20px', background: 'var(--bg-app)' }}>
              {/* Linode Token */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('mirotalk.modal.linodeToken')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={linodeToken}
                  onChange={(e) => setLinodeToken(e.target.value)}
                  placeholder={t('mirotalk.modal.linodeTokenPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>
                  Get your token from <a href="https://cloud.linode.com/profile/tokens" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>cloud.linode.com/profile/tokens</a>
                </p>
              </div>

              {/* MiroTalk API Secret */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('mirotalk.modal.apiSecret')}
                </label>
                <input
                  type="password"
                  value={apiKeySecret}
                  onChange={(e) => setApiKeySecret(e.target.value)}
                  placeholder={t('mirotalk.modal.apiSecretPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>



              {/* Save Config Button */}
              <button
                onClick={handleSaveConfig}
                disabled={!linodeToken}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: configSaved 
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : linodeToken 
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                    : 'rgba(148, 163, 184, 0.3)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: linodeToken ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {configSaved ? (
                  <>
                    <CheckCircle2 size={14} />
                    {t('mirotalk.notifications.configSaved')}
                  </>
                ) : (
                  t('mirotalk.modal.saveConfig')
                )}
              </button>
            </div>
          )}
        </div>

        {/* Room name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t('mirotalk.modal.roomName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('mirotalk.modal.roomNamePlaceholder')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Region */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t('mirotalk.modal.serverRegion')}
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {config?.defaultRegions?.map(r => (
              <option key={r.id} value={r.id}>{t(`mirotalk.regions.${r.id}`, r.name)}</option>
            ))}
          </select>
        </div>

        {/* Instance type */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t('mirotalk.modal.serverSize')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {config?.instanceTypes?.map(type => (
              <button
                key={type.id}
                onClick={() => setInstanceType(type.id)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: instanceType === type.id 
                    ? '2px solid #10b981' 
                    : '1px solid var(--border-color)',
                  background: instanceType === type.id 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'var(--bg-app)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t(`mirotalk.instanceTypes.${type.id}`, type.name)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{type.specs}</div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>{type.recommended}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t('mirotalk.modal.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !hasToken}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: hasToken 
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(148, 163, 184, 0.3)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !hasToken ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('mirotalk.modal.creating')}
              </>
            ) : !hasToken ? (
              t('mirotalk.modal.configureTokenFirst')
            ) : (
              <>
                <Server size={16} />
                {t('mirotalk.modal.create')}
              </>
            )}
          </button>
        </div>

        {!hasToken && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}>
            <p style={{ fontSize: '12px', color: '#fbbf24', margin: 0 }}>
              {t('mirotalk.modal.tokenWarning')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main MiroTalk service page
const MiroTalkService = () => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/rooms`);
      const data = await response.json();
      if (data.success) {
        setRooms(data.rooms);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`${t('mirotalk.notifications.loadError')}: ${err.message}`);
    }
  }, [t]);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/config`);
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchConfig()]);
      setLoading(false);
    };
    init();
  }, [fetchRooms, fetchConfig]);

  // Auto-refresh rooms every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Create room
  const handleCreateRoom = async (roomData) => {
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      const data = await response.json();
      if (data.success) {
        await fetchRooms();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`${t('mirotalk.notifications.createError')}: ${err.message}`);
    }
  };

  // Destroy room using direct Linode API (simpler than Terraform)
  const handleDestroyRoom = async (roomId) => {
    if (!confirm(t('mirotalk.notifications.confirmDestroy'))) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/rooms/${roomId}/destroy`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchRooms();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`${t('mirotalk.notifications.destroyError')}: ${err.message}`);
    }
  };

  // Refresh single room
  const handleRefreshRoom = async (roomId) => {
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/rooms/${roomId}`);
      const data = await response.json();
      if (data.success) {
        setRooms(prev => prev.map(r => r.id === roomId ? data.room : r));
      }
    } catch (err) {
      console.error('Failed to refresh room:', err);
    }
  };

  // Save configuration
  const handleSaveConfig = async (newConfig) => {
    try {
      const response = await fetch(`${API_BASE}/api/mirotalk/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await response.json();
      if (data.success) {
        // Refresh config to get updated state
        await fetchConfig();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`${t('mirotalk.notifications.configError')}: ${err.message}`);
    }
  };

  // Cleanup failed rooms
  const handleCleanup = async () => {
    try {
      setCleaningUp(true);
      const response = await fetch(`${API_BASE}/api/mirotalk/cleanup`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchRooms();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`${t('mirotalk.notifications.cleanupError')}: ${err.message}`);
    } finally {
      setCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        color: '#94a3b8'
      }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '40px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <Video size={24} style={{ color: '#10b981' }} />
            </div>
            {t('mirotalk.title')}
          </h1>
          <p style={{ 
            fontSize: '15px', 
            color: '#94a3b8',
            marginTop: '8px',
            marginLeft: '62px'
          }}>
            {t('mirotalk.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCleanup}
            disabled={cleaningUp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '600',
              cursor: cleaningUp ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: cleaningUp ? 0.7 : 1
            }}
          >
            {cleaningUp ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={18} />}
            {t('mirotalk.actions.cleanup')}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
            }}
          >
            <Plus size={18} />
            {t('mirotalk.createRoom')}
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '14px', color: '#fca5a5' }}>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#818cf8' }}>
            {rooms.length}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t('mirotalk.stats.totalRooms')}</div>
        </div>
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
            {rooms.filter(r => r.status === 'running').length}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t('mirotalk.stats.activeRooms')}</div>
        </div>
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fbbf24' }}>
            {rooms.filter(r => r.status === 'provisioning').length}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t('mirotalk.stats.provisioning')}</div>
        </div>
      </div>

      {/* Rooms grid */}
      {rooms.length === 0 ? (
        <div style={{
          padding: '80px 40px',
          textAlign: 'center',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Video size={48} style={{ color: '#475569', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {t('mirotalk.noRooms')}
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            {t('mirotalk.noRoomsPrompt')}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px'
        }}>
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onDestroy={handleDestroyRoom}
              onRefresh={handleRefreshRoom}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRoom}
        config={config}
        onSaveConfig={handleSaveConfig}
        t={t}
      />
    </div>
  );
};

export default MiroTalkService;
