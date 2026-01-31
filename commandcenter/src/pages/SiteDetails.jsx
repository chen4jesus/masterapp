import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { LayoutGrid, Settings, ArrowLeft, ExternalLink, BookOpen, Calendar, Eye, LayoutList, Search, ArrowUpDown, Filter, Send } from 'lucide-react';
import { getSiteBySlug, getBooks, updateSite, deleteSite } from '../services/apiService';

const SiteDetails = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSiteBySlug(slug),
      getBooks(slug)
    ]).then(([siteData, booksData]) => {
      setSite(siteData);
      setBooks(booksData);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('siteDetails.loading')}
    </div>
  );
  
  if (!site) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('siteDetails.notFound')}
    </div>
  );

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

  // Filter and Sort Logic
  const filteredBooks = books.filter(book => 
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (book.slug && book.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle dates
    if (sortConfig.key === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    setSortConfig(current => ({
        key,
        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const BookCard = ({ book }) => (
    <Link 
      to={`/websites/${slug}/books/${book.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: '100%',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        const badge = e.currentTarget.querySelector('.view-badge');
        if(badge) {
            badge.style.opacity = '1';
            badge.style.transform = 'translateY(0)';
        }
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        const badge = e.currentTarget.querySelector('.view-badge');
        if(badge) {
            badge.style.opacity = '0';
            badge.style.transform = 'translateY(-10px)';
        }
      }}
    >
      {/* Cover Image */}
      <div style={{
        aspectRatio: '2/3',
        backgroundColor: '#1e293b',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {book.cover ? (
          <img 
            src={book.cover.url} 
            alt={book.name} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          }}>
            <BookOpen size={48} style={{ color: '#334155' }} />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
        }} />
        
        {/* Book Info Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {book.name}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            color: '#94a3b8',
          }}>
            <span style={{
              backgroundColor: 'rgba(99, 102, 241, 0.85)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: '600',
            }}>
              {book.slug}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={10} />
              {new Date(book.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Hover View Button */}
        <div 
          className="view-badge"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0,
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease',
          }}
        >
          <Eye size={14} /> {t('siteDetails.books.viewBook')}
        </div>
      </div>
    </Link>
  );

  const BookListItem = ({ book }) => (
    <Link 
      to={`/websites/${slug}/books/${book.slug}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '16px',
        textDecoration: 'none',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
        {/* Cover Thumbnail */}
        <div style={{
            width: '60px',
            height: '80px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#1e293b',
            flexShrink: 0,
        }}>
             {book.cover ? (
              <img src={book.cover.url} alt={book.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} style={{ color: '#475569' }} />
              </div>
            )}
        </div>
        
        {/* Info */}
        <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{book.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
                 <span style={{ fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{book.slug}</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(book.created_at).toLocaleDateString()}</span>
            </div>
        </div>
        
        {/* Action */}
        <div style={{ paddingRight: '10px' }}>
            <span style={{ color: '#818cf8', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {t('websites.manage')} <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </span>
        </div>
    </Link>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link 
          to="/websites" 
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
          <ArrowLeft size={16} /> {t('siteDetails.backToWebsites')}
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
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#818cf8' }}>
                {site.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {site.name}
              </h1>
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#818cf8',
                  textDecoration: 'none',
                  marginTop: '6px',
                }}
              >
                {site.url} <ExternalLink size={12} />
              </a>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {site.status || t('websites.healthy')}
            </span>
          </div>
        </div>
      </div>

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
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
          icon={LayoutGrid} 
          label={t('siteDetails.tabs.overview')} 
        />
        <TabButton 
          active={activeTab === 'books'} 
          onClick={() => setActiveTab('books')} 
          icon={BookOpen} 
          label={t('siteDetails.tabs.books', { count: books.length })} 
        />
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={Settings} 
          label={t('siteDetails.tabs.settings')} 
        />
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#64748b',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }}>
            <LayoutGrid size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>{t('siteDetails.overview.panelTitle')}</h3>
            <p>{t('siteDetails.overview.comingSoon')}</p>
          </div>
        )}

        {activeTab === 'books' && (
          <div>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                        type="text"
                        placeholder={t('siteDetails.books.searchPlaceholder')}
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
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Sort Controls */}
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <button 
                            onClick={() => toggleSort('name')}
                            title={t('siteDetails.books.sortByName')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: sortConfig.key === 'name' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: sortConfig.key === 'name' ? '#818cf8' : '#64748b',
                                fontSize: '13px', fontWeight: '500'
                            }}
                         >
                            {t('tableHeaders.name')} {sortConfig.key === 'name' && <ArrowUpDown size={12} />}
                         </button>
                         <button 
                            onClick={() => toggleSort('created_at')}
                            title={t('siteDetails.books.sortByDate')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: sortConfig.key === 'created_at' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: sortConfig.key === 'created_at' ? '#818cf8' : '#64748b',
                                fontSize: '13px', fontWeight: '500'
                            }}
                         >
                            {t('tableHeaders.updated')} {sortConfig.key === 'created_at' && <ArrowUpDown size={12} />}
                         </button>
                    </div>

                    {/* View Toggle */}
                     <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            title={t('siteDetails.books.gridView')}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: viewMode === 'grid' ? '#818cf8' : '#64748b',
                            }}
                        >
                            <LayoutGrid size={16} />
                        </button>
                         <button
                            onClick={() => setViewMode('list')}
                            title={t('siteDetails.books.listView')}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: viewMode === 'list' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: viewMode === 'list' ? '#818cf8' : '#64748b',
                            }}
                        >
                            <LayoutList size={16} />
                        </button>
                     </div>
                </div>
            </div>

            {/* Books List/Grid */}
            {filteredBooks.length > 0 ? (
              viewMode === 'grid' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '24px',
                  }}>
                    {filteredBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
              ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {filteredBooks.map(book => (
                          <BookListItem key={book.id} book={book} />
                      ))}
                  </div>
              )
            ) : (
              <div style={{
                padding: '60px',
                textAlign: 'center',
                color: '#64748b',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                marginTop: '20px'
              }}>
                <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>{t('siteDetails.books.noBooksFound')}</h3>
                <p>{t('siteDetails.books.adjustFilters')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                padding: '24px 32px',
                borderBottom: '1px solid var(--border-glass)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={20} className="text-indigo-500" /> {t('siteDetails.settings.title')}
                </h2>
                <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {t('siteDetails.settings.subtitle')}
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const updatedSite = {
                    ...site,
                    name: e.target.name.value,
                    url: e.target.url.value,
                    slug: e.target.slug.value,
                    api_token: e.target.api_token.value,
                    description: e.target.description.value,
                    blog_url: e.target.blog_url.value,
                    blog_api_key: e.target.blog_api_key.value,
                  };
                  await updateSite(site.id, updatedSite);
                  setSite(updatedSite);
                  // Optional: Show success message
                  alert('Service configuration updated successfully!');
                } catch (error) {
                  alert('Failed to update service: ' + error.message);
                } finally {
                  setLoading(false);
                }
              }} style={{ padding: '32px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Service Name */}
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.fields.name')}</label>
                    <input 
                      name="name"
                      defaultValue={site.name}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* URL */}
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.fields.url')}</label>
                      <input 
                        name="url"
                        defaultValue={site.url}
                        required
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    {/* Slug */}
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.fields.slug')}</label>
                      <input 
                        name="slug"
                        defaultValue={site.slug}
                        required
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* API Token */}
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.fields.apiToken')}</label>
                    <input 
                      name="api_token"
                      defaultValue={site.api_token}
                      required
                      type="password"
                      placeholder="Token ..."
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t('siteDetails.settings.fields.apiTokenHelp')}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.fields.description')}</label>
                    <textarea 
                      name="description"
                      defaultValue={site.description}
                      rows="2"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Blog Integration Section */}
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '24px', 
                    backgroundColor: 'rgba(99, 102, 241, 0.03)', 
                    borderRadius: '16px',
                    border: '1px dashed rgba(99, 102, 241, 0.2)'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#818cf8', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Send size={18} /> {t('siteDetails.settings.blogIntegration.title')}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.blogIntegration.apiUrl')}</label>
                        <input 
                          name="blog_url"
                          defaultValue={site.blog_url || 'http://localhost:3000/api/v1/blog'}
                          placeholder="https://yourblog.com/api/v1/blog"
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{t('siteDetails.settings.blogIntegration.apiKey')}</label>
                        <input 
                          name="blog_api_key"
                          defaultValue={site.blog_api_key || 'development_key_123'}
                          type="password"
                          placeholder="Your Blog API Key"
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (window.confirm(t('siteDetails.settings.deleteConfirm'))) {
                          setLoading(true);
                          try {
                            await deleteSite(site.id);
                            navigate('/websites');
                          } catch (error) {
                            alert(t('siteDetails.settings.errorMessage', { error: error.message }));
                            setLoading(false);
                          }
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                    >
                      {t('siteDetails.settings.deleteButton')}
                    </button>
                    <button 
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                      }}
                    >
                      {t('siteDetails.settings.updateButton')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteDetails;
