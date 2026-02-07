import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RefreshCw, Database, Cloud, Cog, ArrowRight, Globe, Video } from 'lucide-react';

const ServiceCard = ({ service }) => {
  const { t } = useTranslation();
  const isComingSoon = service.comingSoon;
  
  return (
    <Link 
      to={isComingSoon ? '#' : service.path}
      onClick={e => isComingSoon && e.preventDefault()}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: '20px',
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isComingSoon ? 'not-allowed' : 'pointer',
        filter: isComingSoon ? 'grayscale(1) opacity(0.6)' : 'none',
      }}
      onMouseOver={e => {
        if (isComingSoon) return;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px ${service.glowColor}`;
        e.currentTarget.style.borderColor = service.borderColor;
      }}
      onMouseOut={e => {
        if (isComingSoon) return;
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
        background: service.gradient,
        opacity: 0.8,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: service.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${service.iconBorder}`,
        }}>
          <service.icon size={26} style={{ color: service.iconColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {service.name}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
          }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: service.statusBg,
              color: service.statusColor,
            }}>
              {service.status}
            </span>
          </div>
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
        {service.description}
      </p>

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          fontSize: '13px', 
          fontWeight: '600', 
          color: service.iconColor,
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: service.iconBg,
          transition: 'all 0.2s',
        }}>
          {t('services.labels.open')} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
};

const Services = () => {
  const { t } = useTranslation();
  const [dynamicServices, setDynamicServices] = React.useState([]);

  React.useEffect(() => {
    const loadDynamicServices = async () => {
      try {
        const { getManagedSites } = await import('../services/apiService');
        const sites = await getManagedSites();
        const serviceSites = sites.filter(s => s.type === 'service');
        
        const mappedServices = serviceSites.map(site => ({
          id: `site-${site.id}`,
          name: site.name,
          description: site.description,
          path: `/websites/${site.slug}`,
          icon: Globe, // Imported from lucide-react in parent scope
          status: site.status || t('services.status.active'),
          comingSoon: false,
          gradient: 'linear-gradient(90deg, #ec4899, #d946ef)',
          glowColor: 'rgba(236, 72, 153, 0.15)',
          borderColor: 'rgba(236, 72, 153, 0.3)',
          iconBg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(217, 70, 239, 0.1))',
          iconBorder: 'rgba(236, 72, 153, 0.2)',
          iconColor: '#ec4899',
          statusBg: 'rgba(16, 185, 129, 0.1)',
          statusColor: '#10b981',
        }));
        
        setDynamicServices(mappedServices);
      } catch (err) {
        console.error("Failed to load dynamic services", err);
      }
    };
    
    loadDynamicServices();
  }, [t]);

  const staticServices = [
    {
      id: 'mirotalk',
      name: 'MiroTalk Meetings',
      description: 'On-demand video conferencing with auto-scaling Linode VPS. Rooms auto-destruct when empty.',
      path: '/services/mirotalk',
      icon: Video,
      status: t('services.status.available'),
      comingSoon: false,
      gradient: 'linear-gradient(90deg, #10b981, #059669)',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      iconBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
      iconBorder: 'rgba(16, 185, 129, 0.2)',
      iconColor: '#10b981',
      statusBg: 'rgba(16, 185, 129, 0.1)',
      statusColor: '#10b981',
    },
    {
      id: 'sync',
      name: t('services.items.sync.name'),
      description: t('services.items.sync.description'),
      path: '/services/sync',
      icon: RefreshCw,
      status: t('services.status.available'),
      comingSoon: false,
      gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      glowColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      iconBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
      iconBorder: 'rgba(99, 102, 241, 0.2)',
      iconColor: '#818cf8',
      statusBg: 'rgba(16, 185, 129, 0.1)',
      statusColor: '#10b981',
    },
    {
      id: 'database',
      name: t('services.items.database.name'),
      description: t('services.items.database.description'),
      path: '/services',
      icon: Database,
      status: t('services.status.comingSoon'),
      comingSoon: true,
      gradient: 'linear-gradient(90deg, #10b981, #059669)',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      iconBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
      iconBorder: 'rgba(16, 185, 129, 0.2)',
      iconColor: '#10b981',
      statusBg: 'rgba(251, 191, 36, 0.1)',
      statusColor: '#fbbf24',
    },
    {
      id: 'cloud',
      name: t('services.items.cloud.name'),
      description: t('services.items.cloud.description'),
      path: '/services',
      icon: Cloud,
      status: t('services.status.comingSoon'),
      comingSoon: true,
      gradient: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
      glowColor: 'rgba(14, 165, 233, 0.15)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
      iconBg: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(2, 132, 199, 0.1))',
      iconBorder: 'rgba(14, 165, 233, 0.2)',
      iconColor: '#0ea5e9',
      statusBg: 'rgba(251, 191, 36, 0.1)',
      statusColor: '#fbbf24',
    },
    {
      id: 'automation',
      name: t('services.items.automation.name'),
      description: t('services.items.automation.description'),
      path: '/services',
      icon: Cog,
      status: t('services.status.comingSoon'),
      comingSoon: true,
      gradient: 'linear-gradient(90deg, #f97316, #ea580c)',
      glowColor: 'rgba(249, 115, 22, 0.15)',
      borderColor: 'rgba(249, 115, 22, 0.3)',
      iconBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.1))',
      iconBorder: 'rgba(249, 115, 22, 0.2)',
      iconColor: '#f97316',
      statusBg: 'rgba(251, 191, 36, 0.1)',
      statusColor: '#fbbf24',
    },
  ];

  const services = [...dynamicServices, ...staticServices];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          {t('services.title')}
        </h1>
        <p style={{ 
          fontSize: '15px', 
          color: '#94a3b8',
          marginTop: '8px',
        }}>
          {t('services.subtitle')}
        </p>
      </header>

      {/* Services Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px',
      }}>
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
};

export default Services;
