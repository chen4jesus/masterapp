import React, { useState, useEffect } from 'react';
import { Plus, Trash, Save, Loader, Settings } from 'lucide-react';
import Modal from './Modal';
import { getBookConfig, saveBookConfig } from '../../services/apiService';

const BookConfigModal = ({ isOpen, onClose, bookId, bookName }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && bookId) {
      loadConfig();
    }
  }, [isOpen, bookId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getBookConfig(bookId);
      // Convert object to array of {key, value} for editing
      let configArray = Object.entries(data).map(([key, value]) => {
          let displayValue = value;
          if (Array.isArray(value)) displayValue = value.join(', ');
          else if (typeof value === 'object') displayValue = JSON.stringify(value);
          
          return {
            key,
            value: displayValue,
            id: Math.random()
          };
      });

      if (configArray.length === 0) {
        // Add default suggestions if empty
        const defaults = [
            { key: 'book', value: 'book-name' },
            { key: 'author', value: 'author-name' },
            { key: 'categories', value: 'category1, category2' },
            { key: 'tags', value: 'tag1, tag2' }
        ];
        configArray = defaults.map(d => ({ ...d, id: Math.random() }));
      }
      setConfig(configArray);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert array back to object
      const configObj = config.reduce((acc, item) => {
        if (item.key.trim()) {
           let val = item.value;
           // Auto-convert comma-separated lists for specific keys or if it looks like a list
           // We'll enforce array for keys known to be arrays in Hugo usually: categories, tags, aliases
           const arrayKeys = ['categories', 'tags', 'aliases'];
           if (arrayKeys.includes(item.key.trim().toLowerCase()) || (val.includes(',') && !val.trim().startsWith('{') && !val.trim().startsWith('['))) {
               // If it's explicitly an array key, or looks like a CSV list (and not JSON object/array literal)
               // wait, we should be careful. 
               // Let's just do it for specific keys to be safe.
                if (arrayKeys.includes(item.key.trim().toLowerCase())) {
                    val = val.split(',').map(s => s.trim()).filter(s => s);
                }
           }
           acc[item.key.trim()] = val;
        }
        return acc;
      }, {});
      
      await saveBookConfig(bookId, configObj);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    setConfig([...config, { key: '', value: '', id: Math.random() }]);
  };

  const removeRow = (id) => {
    setConfig(config.filter(c => c.id !== id));
  };

  const updateRow = (id, field, val) => {
    setConfig(config.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const styles = {
    row: {
        display: 'flex',
        gap: '12px',
        marginBottom: '12px',
        alignItems: 'center'
    },
    input: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        flex: 1
    },
    keyInput: {
        flex: '0 0 150px',
        fontWeight: '600',
        color: '#a5b4fc'
    },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'center'
    },
    addBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px dashed rgba(99, 102, 241, 0.3)',
        color: '#818cf8',
        padding: '10px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        marginTop: '16px',
        width: '100%',
        justifyContent: 'center',
        transition: 'all 0.2s'
    },
    saveBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#10b981',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        marginLeft: 'auto'
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configuration: ${bookName}`}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          <Loader className="spin" size={24} style={{ marginBottom: '12px' }} />
          <div>Loading configuration...</div>
        </div>
      ) : (
        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                marginBottom: '24px', 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#93c5fd',
                lineHeight: 1.5
            }}>
                Define metadata that will be attached to every page pushed from this book. 
                Use <strong>categories</strong> and <strong>tags</strong> as comma-separated lists.
            </div>

            <div style={{ flex: 1 }}>
                {config.map(item => (
                    <div key={item.id} style={styles.row}>
                        <input 
                            style={{ ...styles.input, ...styles.keyInput }}
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => updateRow(item.id, 'key', e.target.value)}
                        />
                        <div style={{ color: '#475569' }}>:</div>
                        <input 
                            style={styles.input}
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => updateRow(item.id, 'value', e.target.value)}
                        />
                        <button 
                            style={styles.iconBtn} 
                            onClick={() => removeRow(item.id)}
                            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                ))}

                <button 
                    style={styles.addBtn} 
                    onClick={addRow}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                >
                    <Plus size={16} /> Add Field
                </button>
            </div>

            <div style={{ 
                marginTop: '32px', 
                paddingTop: '20px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'flex-end'
            }}>
                <button 
                    style={styles.saveBtn} 
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default BookConfigModal;
