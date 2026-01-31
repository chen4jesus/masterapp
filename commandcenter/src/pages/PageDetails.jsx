import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, BookOpen, Clock } from 'lucide-react';
import { getPage, getBookBySlug } from '../services/apiService';

const PageDetails = () => {
  const { t } = useTranslation();
  const { slug, bookSlug, pageId } = useParams();
  const [page, setPage] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pageData, bookData] = await Promise.all([
          getPage(pageId, slug),
          getBookBySlug(bookSlug, slug)
        ]);
        setPage(pageData);
        setBook(bookData);
      } catch (error) {
        console.error("Failed to load page details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pageId, bookSlug, slug]);

  if (loading) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('pageDetails.loading')}
    </div>
  );
  
  if (!page) return (
    <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
      {t('pageDetails.notFound')}
    </div>
  );

  const renderContent = () => {
    const content = page.raw_html || page.html;
    if (typeof content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return (
      <div>
        <p style={{ fontStyle: 'italic', color: '#64748b' }}>{t('pageDetails.contentNotAvailable')}</p>
        <pre style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '12px',
          marginTop: '16px',
        }}>
          {JSON.stringify(page, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Link 
        to={`/websites/${slug}/books/${bookSlug}`}
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
        <ArrowLeft size={16} /> {t('pageDetails.backToBook')}
      </Link>

      {/* Article Container */}
      <article style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <header style={{
          padding: '32px 40px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)',
        }}>
          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              fontSize: '11px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <FileText size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              {t('pageDetails.typeLabel')}
            </span>
            {book && (
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: '600',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <BookOpen size={12} />
                {book.name}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 20px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}>
            {page.name || t('pageDetails.untitledPage')}
          </h1>
          
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Calendar size={14} style={{ color: '#818cf8' }} />
              </div>
              {t('pageDetails.updated', { date: page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'N/A' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={14} style={{ color: '#34d399' }} />
              </div>
              {t('pageDetails.owner', { name: typeof page.owned_by === 'object' ? (page.owned_by?.name || 'System') : page.owned_by })}
            </span>
          </div>
        </header>

        {/* Content */}
        <div style={{
          padding: '40px',
          color: 'var(--text-secondary)',
          fontSize: '16px',
          lineHeight: 1.8,
        }}>
          <style>{`
            .page-content h1, .page-content h2, .page-content h3, .page-content h4 {
              color: white;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            .page-content p { margin-bottom: 1em; }
            .page-content ul, .page-content ol { margin-left: 1.5em; margin-bottom: 1em; }
            .page-content a { color: #818cf8; text-decoration: underline; }
            .page-content blockquote {
              border-left: 3px solid #6366f1;
              padding-left: 1em;
              margin: 1em 0;
              color: #94a3b8;
              font-style: italic;
            }
            .page-content code {
              background: rgba(99, 102, 241, 0.1);
              padding: 0.2em 0.4em;
              border-radius: 4px;
              font-size: 0.9em;
              color: #a5b4fc;
            }
            .page-content pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 1em;
              border-radius: 8px;
              overflow-x: auto;
            }
          `}</style>
          <div className="page-content">
            {renderContent()}
          </div>
        </div>
      </article>
    </div>
  );
};

export default PageDetails;
