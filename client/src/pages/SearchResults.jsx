import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, Calendar, Tag, Loader, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchNotebooks = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_URL}/api/notebooks/search`, {
          params: { q: query },
          withCredentials: true
        });

        if (response.data.success) {
          setResults(response.data.notebooks);
        } else {
          setError('Failed to search notebooks');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Error searching notebooks');
      } finally {
        setLoading(false);
      }
    };

    searchNotebooks();
  }, [query]);

  const cardStyle = {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #333',
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.2s',
    cursor: 'pointer'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link to="/app/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#9ca3af', textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
            Back to Dashboard
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Search Results
              </h1>
              <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '18px' }}>
                {query ? `Searching for "${query}"` : 'Enter a search query'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <Loader style={{ width: '48px', height: '48px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#1a1a1a', borderRadius: '16px', border: '1px solid #333' }}>
            <p style={{ color: '#ef4444', fontSize: '18px' }}>{error}</p>
          </div>
        )}

        {/* No Query State */}
        {!query && !loading && (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#1a1a1a', borderRadius: '16px', border: '1px solid #333' }}>
            <Search style={{ width: '64px', height: '64px', color: '#6b7280', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}>No search query</h2>
            <p style={{ color: '#9ca3af', fontSize: '16px' }}>Use the search bar in the navigation to search your notebooks</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && query && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#9ca3af', fontSize: '18px' }}>
                Found <span style={{ color: 'white', fontWeight: 'bold' }}>{results.length}</span> notebook{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#1a1a1a', borderRadius: '16px', border: '1px solid #333' }}>
                <FileText style={{ width: '64px', height: '64px', color: '#6b7280', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}>No notebooks found</h2>
                <p style={{ color: '#9ca3af', fontSize: '16px' }}>Try a different search term or create a new notebook</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {results.map((notebook) => (
                  <Link
                    key={notebook._id}
                    to={`/app/notebook/${notebook._id}`}
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#333';
                      e.currentTarget.style.borderColor = '#444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                            {notebook.title}
                          </h3>
                          {notebook.isFeatured && (
                            <span style={{ padding: '4px 12px', backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#f97316', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}>
                          {notebook.summary}
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                            <Calendar style={{ width: '16px', height: '16px' }} />
                            {formatRelativeTime(notebook.createdAt)}
                          </span>
                          {notebook.category && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                              <Tag style={{ width: '16px', height: '16px' }} />
                              {notebook.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
