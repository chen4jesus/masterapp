import React from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Globe, AlertCircle, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <div className="card glass-panel">
    <div className="card-header">
      <span className="card-title">{title}</span>
      <Icon size={20} className="text-indigo-400" color="#818cf8"/>
    </div>
    <div className="stat-value">{value}</div>
    <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
      {change}
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="page-container">
      <header className="mb-8">
        <h1 className="section-title">{t('dashboard.title')}</h1>
        <p className="section-subtitle">{t('dashboard.subtitle')}</p>
      </header>

      <div className="dashboard-grid">
        <StatCard 
          title={t('dashboard.activeServices')}
          value="12" 
          change={t('dashboard.newThisWeek', { count: 2 })}
          icon={Server} 
          trend="up" 
        />
        <StatCard 
          title={t('dashboard.websitesOnline')}
          value="5" 
          change={t('dashboard.allSystemsOperational')}
          icon={Globe} 
          trend="up" 
        />
        <StatCard 
          title={t('dashboard.securityAlerts')}
          value="0" 
          change={t('dashboard.noActiveThreats')}
          icon={CheckCircle} 
          trend="up" 
        />
        <StatCard 
          title={t('dashboard.systemLoad')}
          value="24%" 
          change={t('dashboard.vsLastHour', { percent: -5 })}
          icon={AlertCircle} 
          trend="up" 
        />
      </div>

      {/* Additional sections can be added here */}
    </div>
  );
};

export default Dashboard;
