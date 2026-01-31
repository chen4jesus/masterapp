import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, Calendar, FileText, Eye, Send, Settings } from 'lucide-react';
import { getPages, getBookBySlug, getBookDetails, getPage, pushPageToBlog } from '../services/apiService';
import Modal from '../components/Modals/Modal';
import BookConfigModal from '../components/Modals/BookConfigModal';

const BookDetails = () => {
  const { t } = useTranslation();
  const { slug, bookSlug } = useParams();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedPage, setSelectedPage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageContent, setPageContent] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pushingId, setPushingId] = useState(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkPushing, setIsBulkPushing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === pages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pages.map(p => p.id)));
    }
  };

  const toggleSelectPage = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkPush = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(t('bookDetails.bulkPushConfirm', { count: selectedIds.size }))) return;

    setIsBulkPushing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of Array.from(selectedIds)) {
        setPushingId(id);
        const page = pages.find(p => p.id === id);
        try {
          const fullPage = await getPage(id, slug);
          if (!fullPage) throw new Error("Failed to fetch full page content");
          await pushPageToBlog(fullPage, slug, book);
          successCount++;
        } catch (err) {
          console.error(`Failed to push page ${id}:`, err);
          errorCount++;
        }
      }
      alert(t('bookDetails.pushComplete', { success: successCount, errors: errorCount }));
      if (errorCount === 0) setSelectedIds(new Set());
    } finally {
      setIsBulkPushing(false);
      setPushingId(null);
    }
  };

  const handlePushPage = async (page) => {
    setPushingId(page.id);
    try {
      // First get full content
      const fullPage = await getPage(page.id, slug);
      if (!fullPage) throw new Error("Failed to fetch full page content");
      
      await pushPageToBlog(fullPage, slug, book);
      alert(t('bookDetails.pushSuccess', { name: page.name }));
    } catch (e) {
      console.error("Push failed:", e);
      alert(t('bookDetails.pushFailed', { error: e.message }));
    } finally {
      setPushingId(null);
    }
  };

  const handleViewPage = async (page) => {
    setSelectedPage(page);
    setIsModalOpen(true);
    setPageLoading(true);
    try {
        const content = await getPage(page.id, slug);
        setPageContent(content);
    } catch (e) {
        console.error("Failed to load page content", e);
    } finally {
        setPageLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPage(null);
    setPageContent(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bookData = await getBookBySlug(bookSlug, slug);
        setBook(bookData);
        if (bookData) {
          // Fetch full details to check for chapters/contents
          const fullBookDetails = await getBookDetails(bookData.id, slug);
          
          let hasChapters = false;
          if (fullBookDetails && fullBookDetails.contents) {
             const chapters = fullBookDetails.contents.filter(c => c.type === 'chapter');
             hasChapters = chapters.length > 0;
             
             // If no chapters, use the pages directly from contents
             if (!hasChapters) {
                 const directPages = fullBookDetails.contents.filter(c => c.type === 'page');
                 console.log("Book has no chapters, using direct pages from contents");
                 setPages(directPages);
                 setLoading(false);
                 return;
             }
          }

          // Fallback to getPages if there are chapters or if contents failed
          console.log("Book has chapters or legacy mode, using getPages");
          const allPages = await getPages({ book_id: bookData.id }, slug);
          setPages(allPages);
        }
      } catch (error) {
        console.error("Failed to load book details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookSlug, slug]);

  if (loading) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('bookDetails.loading')}
    </div>
  );
  
  if (!book) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('bookDetails.notFound')}
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link 
        to={`/websites/${slug}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: '#94a3b8',
          textDecoration: 'none',
          marginBottom: '24px',
          transition: 'color 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.color = '#818cf8'}
        onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
      >
        <ArrowLeft size={16} /> {t('bookDetails.backToSite')}
      </Link>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Icon */}
        <Book size={180} style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          color: 'rgba(99, 102, 241, 0.08)',
        }} />
        
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', position: 'relative' }}>
          {/* Book Cover */}
          <div style={{
            width: '140px',
            height: '200px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
          }}>
            {book.cover ? (
              <img src={book.cover.url} alt={book.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              }}>
                <Book size={48} style={{ color: '#334155' }} />
              </div>
            )}
          </div>
          
          {/* Book Info */}
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              fontSize: '11px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}>
              {t('bookDetails.typeLabel')}
            </span>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              {book.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '14px', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: '#818cf8' }} />
                {t('bookDetails.created', { date: new Date(book.created_at).toLocaleDateString() })}
              </span>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#a5b4fc',
              }}>
                {book.slug}
              </span>
              
              <button
                onClick={() => setIsConfigModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <Settings size={14} /> {t('bookDetails.configure')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {t('bookDetails.pages')}
            </h2>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkPush}
                disabled={isBulkPushing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: isBulkPushing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  opacity: isBulkPushing ? 0.8 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <Send size={14} /> {isBulkPushing ? t('bookDetails.pushingSelected') : t('bookDetails.pushSelected', { count: selectedIds.size })}
              </button>
            )}
          </div>
          <span style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#a5b4fc',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            {t('bookDetails.pageCount', { count: pages.length })}
          </span>
        </div>
        
        {/* Pages Table */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <th style={{ padding: '16px 20px', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={pages.length > 0 && selectedIds.size === pages.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bookDetails.table.id')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bookDetails.table.title')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bookDetails.table.slug')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bookDetails.table.created')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bookDetails.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, index) => (
                <tr 
                  key={page.id}
                  style={{
                    borderBottom: index < pages.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                    transition: 'background-color 0.2s',
                    backgroundColor: selectedIds.has(page.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                  }}
                  onMouseOver={e => {
                    if (!selectedIds.has(page.id)) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseOut={e => {
                    if (!selectedIds.has(page.id)) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(page.id)}
                      onChange={() => toggleSelectPage(page.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#64748b' }}>{page.id}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link 
                      to={`/websites/${slug}/books/${bookSlug}/pages/${page.id}`}
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontWeight: '500',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#818cf8'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    >
                      {page.name}
                    </Link>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#a5b4fc',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}>
                      {page.slug}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#64748b' }}>
                    {new Date(page.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleViewPage(page)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          color: '#818cf8',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                        }}
                      >
                        <Eye size={14} /> {t('bookDetails.actions.view')}
                      </button>

                      <button
                        onClick={() => handlePushPage(page)}
                        disabled={pushingId === page.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: pushingId === page.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)',
                          color: '#34d399',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          border: 'none',
                          cursor: pushingId === page.id ? 'not-allowed' : 'pointer',
                          opacity: pushingId === page.id ? 0.7 : 1,
                        }}
                        onMouseOver={e => {
                          if (pushingId !== page.id) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        }}
                        onMouseOut={e => {
                          if (pushingId !== page.id) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        }}
                      >
                        <Send size={14} /> {pushingId === page.id ? t('bookDetails.actions.pushing') : t('bookDetails.actions.push')}
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {pages.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>{t('bookDetails.noPages')}</p>
            </div>
          )}
        </div>
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={selectedPage?.name || t('bookDetails.modal.title')}
      >
        {pageLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('bookDetails.modal.contentLoading')}</div>
        ) : (
            <>
              <div dangerouslySetInnerHTML={{ __html: pageContent?.html || `<p>${t('bookDetails.modal.noContent')}</p>` }} />
              <div style={{ 
                marginTop: '32px', 
                paddingTop: '20px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => handlePushPage(selectedPage)}
                  disabled={pushingId === selectedPage?.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: pushingId === selectedPage?.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)',
                    color: '#34d399',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: pushingId === selectedPage?.id ? 'not-allowed' : 'pointer',
                    opacity: pushingId === selectedPage?.id ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => {
                    if (pushingId !== selectedPage?.id) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseOut={e => {
                    if (pushingId !== selectedPage?.id) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  }}
                >
                  <Send size={16} /> {pushingId === selectedPage?.id ? t('bookDetails.modal.pushingContent') : t('bookDetails.modal.pushToBlog')}
                </button>
              </div>
            </>
        )}
      </Modal>

      <BookConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        bookId={book?.id} 
        bookName={book?.name} 
      />
    </div>
  );
};

export default BookDetails;
