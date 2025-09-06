import { useState } from 'react';
import { Search, Brain, FileText, Sparkles, TrendingUp, Clock } from 'lucide-react';

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: {
    documentName: string;
    documentType: string;
    medicalCategories: string[];
  };
}

interface SemanticSearchProps {
  userId: string;
  onDocumentSelect?: (documentId: string) => void;
}

export function SemanticSearch({ userId, onDocumentSelect }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchPerformed(true);
    
    try {
      const response = await fetch('/api/documents/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId,
          options: {
            limit: 10,
            minScore: 0.7
          }
        })
      });

      const data = await response.json();
      setResults(data.results || []);

      // Log search for analytics
      console.log('Semantic search performed:', {
        query,
        resultCount: data.results?.length || 0,
        userId
      });

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'lab-results': 'bg-blue-100 text-blue-800',
      'medical-records': 'bg-green-100 text-green-800',
      'medications': 'bg-purple-100 text-purple-800',
      'imaging': 'bg-orange-100 text-orange-800',
      'insurance': 'bg-gray-100 text-gray-800',
      'appointments': 'bg-indigo-100 text-indigo-800',
      'vitals': 'bg-red-100 text-red-800',
      'allergies': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-slate-100 text-slate-800'
    };
    return colors[category] || colors['general'];
  };

  const formatScore = (score: number): string => {
    return `${(score * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI-Powered Document Search</h2>
        </div>
        <p className="text-sm text-gray-600">
          Search your health documents using natural language. Ask questions like &quot;What were my cholesterol levels?&quot; or &quot;Show me recent blood tests&quot;
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your health documents with natural language..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={isSearching}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isSearching ? (
              <>
                <Brain className="w-4 h-4 animate-pulse" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Search suggestions */}
        {!searchPerformed && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'blood pressure readings',
                'recent lab results',
                'medications I\'m taking',
                'allergy information',
                'last doctor visit'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchPerformed && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Search Results ({results.length})
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Just now
                </div>
              </div>

              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.chunkId}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
                    onClick={() => onDocumentSelect?.(result.documentId)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                          {result.metadata.documentName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          {formatScore(result.score)} match
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-3 mb-3 leading-relaxed">
                      {result.content}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {result.metadata.medicalCategories?.map((category: string) => (
                        <span
                          key={category}
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}
                        >
                          {category.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-500 mb-4">
                No relevant documents found for &quot;<span className="font-medium">{query}</span>&quot;
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Try different keywords or:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use simpler terms (e.g., &quot;blood test&quot; instead of &quot;complete blood count&quot;)</li>
                  <li>Search for symptoms or conditions</li>
                  <li>Include date ranges (e.g., &quot;recent results&quot;)</li>
                  <li>Upload more documents for better search results</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Features Notice */}
      {!searchPerformed && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 mb-1">Powered by AI</h4>
              <p className="text-sm text-purple-700">
                Our semantic search understands context and meaning, not just keywords. 
                It can find relevant information even when you don&apos;t use exact medical terms.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
