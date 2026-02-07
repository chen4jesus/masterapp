import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Server, Globe, Settings, Activity, Command, Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const currentLang = i18n.language || 'en';
    const newLang = currentLang.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
    { icon: Server, label: t('sidebar.services'), path: '/services' },
    { icon: Globe, label: t('sidebar.websites'), path: '/websites' },
    { icon: Activity, label: t('sidebar.monitoring'), path: '/monitoring' },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings' },
  ];

  return (
    <aside className="sidebar glass">
      {/* Brand */}
      <div className="sidebar-header">
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }}>
          <Command size={18} color="white" />
        </div>
        <span className="brand-text">{t('sidebar.brand')}</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User Profile */}
        <div className="user-profile">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            fontWeight: '700',
            fontSize: '13px',
          }}>
            US
          </div>
          <div className="user-info">
            <span className="user-name">{t('sidebar.user.name')}</span>
            <span className="user-role">{t('sidebar.user.role')}</span>
          </div>
        </div>

        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          style={{
            width: '100%',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
          }}
        >
          <Languages size={18} />
          {(i18n.language || 'en').startsWith('en') ? '中文' : 'English'}
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            width: '100%',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '13px',
            fontWeight: '600',
            color: theme === 'dark' ? '#fbbf24' : '#818cf8',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 4px 12px rgba(251, 191, 36, 0.2)'
              : '0 4px 12px rgba(99, 102, 241, 0.2)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={18} />
              {t('sidebar.switchToLight')}
            </>
          ) : (
            <>
              <Moon size={18} />
              {t('sidebar.switchToDark')}
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
