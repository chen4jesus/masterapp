import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Websites from './pages/Websites';
import SiteDetails from './pages/SiteDetails';
import BookDetails from './pages/BookDetails';
import PageDetails from './pages/PageDetails';
import Services from './pages/Services';
import MiroTalkService from './pages/MiroTalkService';
import BookStackSync from './components/Sync/BookStackSync';
import { ThemeProvider } from './context/ThemeContext';

const PagePlaceholder = ({ titleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="page-container">
      <h1 className="section-title">{t(titleKey)}</h1>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/websites" element={<Websites />} />
          <Route path="/websites/:slug" element={<SiteDetails />} />
          <Route path="/websites/:slug/books/:bookSlug" element={<BookDetails />} />
          <Route path="/websites/:slug/books/:bookSlug/pages/:pageId" element={<PageDetails />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/sync" element={<BookStackSync />} />
          <Route path="/services/mirotalk" element={<MiroTalkService />} />
          <Route path="/monitoring" element={<PagePlaceholder titleKey="sidebar.monitoring" />} />
          <Route path="/settings" element={<PagePlaceholder titleKey="sidebar.settings" />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
