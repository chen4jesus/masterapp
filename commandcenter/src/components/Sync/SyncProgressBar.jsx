import React from 'react';
import { useTranslation } from 'react-i18next';

const SyncProgressBar = ({ status }) => {
  const { t } = useTranslation();
  
  // Calculate progress percentage based on status
  let progressPercentage = 0;
  
  switch (status) {
    case 'Pending':
      progressPercentage = 0;
      break;
    case 'Syncing...':
      progressPercentage = 50;
      break;
    case 'Completed':
      progressPercentage = 100;
      break;
    case 'Failed':
      progressPercentage = 100;
      break;
    default:
      progressPercentage = 0;
  }
  
  // Determine color based on status
  let barColor = 'var(--accent-primary)';
  let bgColor = 'rgba(99, 102, 241, 0.2)';
  
  if (status === 'Completed') {
    barColor = '#10b981';
    bgColor = 'rgba(16, 185, 129, 0.2)';
  } else if (status === 'Failed') {
    barColor = '#ef4444';
    bgColor = 'rgba(239, 68, 68, 0.2)';
  }
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return t('status.pending');
      case 'Syncing...': return t('status.syncing');
      case 'Completed': return t('status.completed');
      case 'Failed': return t('status.failed');
      default: return status;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--text-secondary)'
        }}>
          {getStatusLabel(status)}
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--text-secondary)'
        }}>
          {progressPercentage}%
        </span>
      </div>
      <div style={{
        width: '100%',
        backgroundColor: bgColor,
        borderRadius: '999px',
        height: '6px',
        overflow: 'hidden'
      }}>
        <div 
          style={{
            backgroundColor: barColor,
            height: '6px',
            borderRadius: '999px',
            transition: 'all 0.3s ease-in-out',
            width: `${progressPercentage}%`
          }}
        />
      </div>
    </div>
  );
};

export default SyncProgressBar;
