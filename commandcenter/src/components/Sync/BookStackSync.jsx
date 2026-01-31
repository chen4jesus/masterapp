import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, RefreshCw, Trash2, LayoutGrid, LayoutList, Search, Filter, CheckCircle, AlertCircle, Upload, Download, Settings, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SpringBootApi from '../../services/springBootApi';
import SyncProgressBar from './SyncProgressBar';
import { SyncConfigForm, CONFIG_UPDATED_EVENT } from './SyncConfigForm';

// Create a single instance of the Spring Boot API
const springBootApi = new SpringBootApi();

// Books per page for pagination
const ITEMS_PER_PAGE = 15;

const BookStackSync = () => {
  const { t } = useTranslation();
  
  // Main state
  const [books, setBooks] = useState([]);
  const [destinationBooks, setDestinationBooks] = useState([]);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [selectedDestinationBookIds, setSelectedDestinationBookIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [syncProgress, setSyncProgress] = useState({});
  const [activeTab, setActiveTab] = useState('source'); // 'source' | 'destination' | 'config'
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOption, setSortOption] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Sync metrics
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncDuration, setSyncDuration] = useState(null);
  
  // Check API status
  const checkApiStatus = async () => {
    try {
      const config = await springBootApi.getConfig();
      
      if (config) {
        try {
          const result = await springBootApi.verifyCredentials();
          if (result.sourceCredentialsValid) {
            setApiStatus('online');
          } else {
            setApiStatus('offline');
          }
        } catch (err) {
          setApiStatus('offline');
          console.error(err);
        }
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
      console.error(err);
    }
  };

  useEffect(() => {
    checkApiStatus();
    loadDestinationBooks(); // Load destination books initially to check sync status
    
    const handleConfigUpdate = () => {
      checkApiStatus();
      setBooks([]);
      setDestinationBooks([]);
    };
    
    window.addEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
    
    return () => {
      window.removeEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
    };
  }, []);

  // Load source books
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const books = await springBootApi.listBooks();
      setBooks(books);
    } catch (err) {
      setError(t('sync.errorLoadBooks'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load destination books
  const loadDestinationBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const books = await springBootApi.listDestinationBooks();
      setDestinationBooks(books);
    } catch (err) {
      setError(t('sync.errorLoadDestBooks'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle book selection
  const handleBookSelection = (bookId) => {
    setSelectedBookIds(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  const handleDestinationBookSelection = (bookId) => {
    setSelectedDestinationBookIds(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  // Check if book is in destination
  const isBookInDestination = (book) => {
    return destinationBooks.some(destBook => 
      destBook.name.trim().toLowerCase() === book.name.trim().toLowerCase()
    );
  };

  // Sort and filter books
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => (
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.description && book.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ))
      .sort((a, b) => {
        let comparison = 0;
        switch (sortOption) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'updated_at':
            comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [books, searchQuery, sortOption, sortDirection]);

  const filteredDestinationBooks = useMemo(() => {
    return destinationBooks
      .filter(book => (
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.description && book.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ))
      .sort((a, b) => {
        let comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [destinationBooks, searchQuery, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));
  const currentBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const totalDestinationPages = Math.max(1, Math.ceil(filteredDestinationBooks.length / ITEMS_PER_PAGE));
  const currentDestinationBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDestinationBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDestinationBooks, currentPage]);

  // Handle sync
  const handleSync = async () => {
    if (selectedBookIds.length === 0) {
      setError(t('sync.btnSelectToSync'));
      return;
    }

    try {
      const syncStartTime = Date.now();
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const initialProgress = selectedBookIds.reduce((acc, id) => {
        acc[id] = 'Pending';
        return acc;
      }, {});
      
      setSyncProgress(initialProgress);

      let completedCount = 0;
      let failedCount = 0;
      
      for (const bookId of selectedBookIds) {
        const book = books.find(b => b.id === bookId);
        if (!book) continue;
        
        try {
          setSyncProgress(prev => ({ ...prev, [bookId]: 'Syncing...' }));
          await springBootApi.syncBook(bookId);
          setSyncProgress(prev => ({ ...prev, [bookId]: 'Completed' }));
          completedCount++;
        } catch (err) {
          console.error(`Error syncing book ${book.name}:`, err);
          setSyncProgress(prev => ({ ...prev, [bookId]: 'Failed' }));
          failedCount++;
        }
      }
      
      const syncEndTime = Date.now();
      const duration = Math.round((syncEndTime - syncStartTime) / 1000);
      setSyncDuration(duration);
      setLastSyncTime(new Date());
      
      await loadDestinationBooks();
      
      if (failedCount === 0) {
        setSuccess(t('sync.syncSuccessAll', { count: completedCount }));
      } else {
        setSuccess(t('sync.syncSuccessPartial', { success: completedCount, failed: failedCount }));
      }
    } catch (err) {
      setError(t('sync.errorSync'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
    
    if (tab === 'destination') {
      loadDestinationBooks();
    }
  };

  // Tab button component
  const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 20px',
        fontSize: '14px',
        fontWeight: '500',
        border: 'none',
        background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        color: active ? '#818cf8' : '#94a3b8',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  // Book card component
  const BookCard = ({ book, isSelected, onSelect, syncStatus, isInDest }) => {
    const getLocalizedStatus = (status) => {
      switch (status) {
        case 'Pending': return t('sync.statusPending');
        case 'Syncing...': return t('sync.statusSyncing');
        case 'Completed': return t('sync.statusCompleted');
        case 'Failed': return t('sync.statusFailed');
        default: return status;
      }
    };

    return (
      <div
        onClick={onSelect}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: isSelected 
            ? '2px solid rgba(99, 102, 241, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }}
        onMouseOver={e => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
          }
        }}
        onMouseOut={e => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          }
        }}
      >
        {/* Cover */}
        <div style={{
          aspectRatio: '3/2',
          backgroundColor: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {book.cover && book.cover.url ? (
            <img 
              src={book.cover.url} 
              alt={book.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback Icon - shown if no image or error */}
          <div style={{
            display: (book.cover && book.cover.url) ? 'none' : 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: '#1e293b'
          }}>
            <BookOpen size={40} style={{ color: '#475569' }} />
          </div>

          {/* Selected Overlay */}
          {isSelected && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(1px)',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}>
                <CheckCircle size={28} style={{ color: '#6366f1' }} fill="#6366f1" />
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div style={{ padding: '16px' }}>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {book.name}
          </h3>
          
          {/* Status */}
          <div style={{ marginTop: '12px' }}>
            {isInDest ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                <CheckCircle size={12} /> {t('sync.statusInDest')}
              </span>
            ) : syncStatus && syncStatus !== 'Completed' ? (
              <SyncProgressBar status={getLocalizedStatus(syncStatus)} />
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {t('sync.statusNotSynced')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link 
          to="/services" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#94a3b8',
            textDecoration: 'none',
            marginBottom: '20px',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#818cf8'}
          onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
        >
          <ArrowLeft size={16} /> {t('sync.backToServices')}
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RefreshCw size={28} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {t('sync.title')}
              </h1>
              <p style={{ 
                fontSize: '14px', 
                color: '#94a3b8',
                marginTop: '6px',
              }}>
                {t('sync.subtitle')}
              </p>
            </div>
          </div>
          
          {/* API Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: apiStatus === 'online' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${apiStatus === 'online' 
              ? 'rgba(16, 185, 129, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)'}`,
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: apiStatus === 'online' ? '#10b981' : '#ef4444',
              boxShadow: `0 0 10px ${apiStatus === 'online' ? '#10b981' : '#ef4444'}`,
            }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: apiStatus === 'online' ? '#10b981' : '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {apiStatus === 'online' ? t('sync.connected') : t('sync.notConnected')}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={18} />
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {t('sync.dismiss')}
          </button>
        </div>
      )}

      {success && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={18} />
          {success}
          <button 
            onClick={() => setSuccess(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {t('sync.dismiss')}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px',
        padding: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        width: 'fit-content',
      }}>
        <TabButton 
          active={activeTab === 'source'} 
          onClick={() => handleTabChange('source')} 
          icon={Upload} 
          label={t('sync.tabSource', { count: books.length })} 
        />
        <TabButton 
          active={activeTab === 'destination'} 
          onClick={() => handleTabChange('destination')} 
          icon={Download} 
          label={t('sync.tabDestination', { count: destinationBooks.length })} 
        />
        <TabButton 
          active={activeTab === 'config'} 
          onClick={() => handleTabChange('config')} 
          icon={Settings} 
          label={t('sync.tabConfig')} 
        />
      </div>

      {/* Source Books Tab */}
      {activeTab === 'source' && (
        <div>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={loadBooks}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {t('sync.btnLoadSource')}
            </button>

            {/* Select All Button */}
            {books.length > 0 && (
              <button
                onClick={() => {
                  if (selectedBookIds.length === filteredBooks.length) {
                    setSelectedBookIds([]);
                  } else {
                    setSelectedBookIds(filteredBooks.map(b => b.id));
                  }
                }}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <CheckCircle size={16} />
                {selectedBookIds.length === filteredBooks.length ? t('sync.btnDeselectAll') : t('sync.btnSelectAll')}
              </button>
            )}

            <button
              onClick={handleSync}
              disabled={loading || selectedBookIds.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: selectedBookIds.length > 0 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: selectedBookIds.length > 0 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (loading || selectedBookIds.length === 0) ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: selectedBookIds.length > 0 ? '0 8px 24px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={16} />
              {selectedBookIds.length > 0 ? t('sync.btnSyncSelected', { count: selectedBookIds.length }) : t('sync.btnSelectToSync')}
            </button>

            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text"
                placeholder={t('sync.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
            }}>
              {currentBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={selectedBookIds.includes(book.id)}
                  onSelect={() => handleBookSelection(book.id)}
                  syncStatus={syncProgress[book.id]}
                  isInDest={isBookInDestination(book)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: '80px 40px',
              textAlign: 'center',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: '#64748b',
            }}>
              <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>{t('sync.noBooksLoaded')}</h3>
              <p>{t('sync.clickToLoad')}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', gap: '8px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: currentPage === page ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                    color: currentPage === page ? 'white' : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Destination Books Tab */}
      {activeTab === 'destination' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={loadDestinationBooks}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? <Loader2 size={16} /> : <RefreshCw size={16} />}
              {t('sync.btnRefreshDest')}
            </button>
          </div>

          {destinationBooks.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
            }}>
              {currentDestinationBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={selectedDestinationBookIds.includes(book.id)}
                  onSelect={() => handleDestinationBookSelection(book.id)}
                  isInDest={true}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: '80px 40px',
              textAlign: 'center',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: '#64748b',
            }}>
              <Download size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>{t('sync.noDestBooks')}</h3>
              <p>{t('sync.syncToSee')}</p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <SyncConfigForm />
      )}
    </div>
  );
};

export default BookStackSync;
