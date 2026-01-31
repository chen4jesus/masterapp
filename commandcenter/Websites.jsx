import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Activity, CheckCircle, Plus, ExternalLink, BookOpen } from 'lucide-react';
import { getManagedSites } from '../services/apiService';
import AddSiteModal from '../components/Modals/AddSiteModal';

const WebsiteCard = ({ site }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/websites/${site.slug}`)}
      className="block group"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
        padding: '28px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(99, 102, 241, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      {/* Gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
        opacity: 0.8,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}>
            <Globe size={26} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {site.name}
            </h3>
            <div 
               style={{ 
                 fontSize: '13px', 
                 color: '#94a3b8', 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '4px',
                 marginTop: '4px',
                 cursor: 'pointer'
               }}
               onClick={(e) => {
                 e.stopPropagation();
                 window.open(site.url, '_blank', 'noopener,noreferrer');
               }}
            >
              {site.url} <ExternalLink size={11} />
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {site.status || 'Healthy'}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ 
        color: '#94a3b8', 
        fontSize: '14px', 
        lineHeight: '1.6',
        marginBottom: '24px',
        minHeight: '44px',
      }}>
        {site.description || 'No description provided.'}
      </p>

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <Activity size={14} style={{ color: '#10b981' }} /> 99.9% Uptime
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <BookOpen size={14} style={{ color: '#818cf8' }} /> Books
          </span>
        </div>
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          fontSize: '13px', 
          fontWeight: '600', 
          color: '#818cf8',
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          transition: 'all 0.2s',
        }}>
          Manage <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
};

const Websites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSites = async () => {
    setLoading(true);
    const data = await getManagedSites();
    setSites(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSiteAdded = () => {
    fetchSites();
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '40px',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Managed Websites
          </h1>
          <p style={{ 
            fontSize: '15px', 
            color: '#94a3b8',
            marginTop: '8px',
          }}>
            Monitor and manage your connected web properties
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.45)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.35)';
          }}
        >
          <Plus size={18} /> Add New Site
        </button>
      </header>

      <AddSiteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSiteAdded={handleSiteAdded}
      />

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '24px',
      }}>
        {sites.map(site => (
          <WebsiteCard key={site.id} site={site} />
        ))}
        
        {sites.length === 0 && !loading && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '80px 40px',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            color: '#64748b',
          }}>
            <Globe size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>No sites configured</h3>
            <p>Click "Add New Site" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Websites;
