import { memo, useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

const TrustPilot = () => {
  // State for filters
  const [query, setQuery] = useState('software company');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  
  // State for data and loading
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [error, setError] = useState('');
  
  // Refs
  const observerRef = useRef(null);

  // All available locations (dropdown options)
  const allLocations = [
    'New York, USA',
    'Los Angeles, USA',
    'Chicago, USA',
    'Houston, USA',
    'Phoenix, USA',
    'Philadelphia, USA',
    'San Antonio, USA',
    'San Diego, USA',
    'Dallas, USA',
    'San Jose, USA',
    'London, UK',
    'Manchester, UK',
    'Birmingham, UK',
    'Leeds, UK',
    'Glasgow, UK',
    'Toronto, Canada',
    'Vancouver, Canada',
    'Montreal, Canada',
    'Calgary, Canada',
    'Sydney, Australia',
    'Melbourne, Australia',
    'Brisbane, Australia',
    'Perth, Australia',
    'Berlin, Germany',
    'Munich, Germany',
    'Frankfurt, Germany',
    'Paris, France',
    'Lyon, France',
    'Marseille, France',
    'Tokyo, Japan',
    'Osaka, Japan',
    'Nagoya, Japan',
    'Mumbai, India',
    'Delhi, India',
    'Bangalore, India',
    'Chennai, India',
    'Singapore',
    'Hong Kong',
    'Dubai, UAE',
    'Abu Dhabi, UAE'
  ];

  // Group locations by country for better organization
  const groupedLocations = {
    'United States': [
      'New York, USA',
      'Los Angeles, USA',
      'Chicago, USA',
      'Houston, USA',
      'Phoenix, USA',
      'Philadelphia, USA',
      'San Antonio, USA',
      'San Diego, USA',
      'Dallas, USA',
      'San Jose, USA'
    ],
    'United Kingdom': [
      'London, UK',
      'Manchester, UK',
      'Birmingham, UK',
      'Leeds, UK',
      'Glasgow, UK'
    ],
    'Canada': [
      'Toronto, Canada',
      'Vancouver, Canada',
      'Montreal, Canada',
      'Calgary, Canada'
    ],
    'Australia': [
      'Sydney, Australia',
      'Melbourne, Australia',
      'Brisbane, Australia',
      'Perth, Australia'
    ],
    'Germany': [
      'Berlin, Germany',
      'Munich, Germany',
      'Frankfurt, Germany'
    ],
    'France': [
      'Paris, France',
      'Lyon, France',
      'Marseille, France'
    ],
    'Japan': [
      'Tokyo, Japan',
      'Osaka, Japan',
      'Nagoya, Japan'
    ],
    'India': [
      'Mumbai, India',
      'Delhi, India',
      'Bangalore, India',
      'Chennai, India'
    ],
    'Other Locations': [
      'Singapore',
      'Hong Kong',
      'Dubai, UAE',
      'Abu Dhabi, UAE'
    ]
  };

  const lastElementRef = useCallback(node => {
    if (loading) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMoreData();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  // Extract company name from URL
  const extractCompanyName = useCallback((url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const companyDomain = pathParts[pathParts.length - 1];
      
      if (companyDomain.includes('.')) {
        const namePart = companyDomain.split('.')[0];
        return namePart
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase());
      }
      return companyDomain;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const constructApiUrl = useCallback(() => {
    if (!API_BASE) return '';

    const params = new URLSearchParams({
      query,
      location: selectedLocation || '',
      frompage: fromPage.toString(),
      topage: toPage.toString()
    });

    return `${API_BASE}/api/trustpilot?${params.toString()}`;
  }, [API_BASE, query, selectedLocation, fromPage, toPage]);

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (!API_BASE) {
      setError('API Base URL not defined');
      return;
    }

    if (!selectedLocation) {
      setError('Please select a location first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = constructApiUrl();
      console.log('Fetching:', url);

      const response = await axios.get(url);
      const data = response.data;

      if (data.success && Array.isArray(data.results)) {
        const processedCompanies = data.results.map(url => ({
          url,
          companyName: extractCompanyName(url),
          hasReviews: true
        }));

        setCompanies(prev =>
          isLoadMore ? [...prev, ...processedCompanies] : processedCompanies
        );

        setTotalResults(data.total || processedCompanies.length);
        setHasMore(processedCompanies.length > 0);
        
        // Update current batch
        if (!isLoadMore) {
          setCurrentBatch(1);
        }
      } else {
        setError('Invalid API response');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, constructApiUrl, extractCompanyName, selectedLocation]);

  // Load more data for infinite scroll
  const loadMoreData = useCallback(() => {
    if (!hasMore || loading || !selectedLocation) return;
    
    const newFromPage = fromPage + (toPage - fromPage + 1);
    const newToPage = newFromPage + 5;
    
    setFromPage(newFromPage);
    setToPage(newToPage);
    setCurrentBatch(prev => prev + 1);
    
    fetchData(true);
  }, [hasMore, loading, fromPage, toPage, fetchData, selectedLocation]);

  // Handle filter changes and apply
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError('Please select a location first');
      return;
    }
    
    setCompanies([]);
    setHasMore(true);
    setFromPage(1);
    setToPage(5);
    setCurrentBatch(1);
    fetchData(false);
  };

  // Download CSV function
  const downloadCSV = () => {
    if (companies.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = ['Company Name', 'TrustPilot URL', 'Status'];
    
    const csvRows = [
      headers.join(','),
      ...companies.map(company => [
        `"${company.companyName?.replace(/"/g, '""') || 'Unknown'}"`,
        company.url,
        company.hasReviews ? 'Active Page' : 'No Reviews/Invalid'
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trustpilot-companies-${selectedLocation.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format URL for display
  const formatUrlForDisplay = (url) => {
    if (url.length > 50) {
      return url.substring(0, 50) + '...';
    }
    return url;
  };

  // Handle location change
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  // Clear selected location
  const handleClearLocation = () => {
    setSelectedLocation('');
  };

  // Quick location buttons handler
  const handleQuickLocationClick = (location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">TrustPilot Company Finder</h2>
      
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., software company"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City/Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                  required
                >
                  <option value="">Select a city...</option>
                  {Object.entries(groupedLocations).map(([country, cities]) => (
                    <optgroup key={country} label={country}>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Page
              </label>
              <input
                type="number"
                value={fromPage}
                onChange={(e) => setFromPage(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Page
              </label>
              <input
                type="number"
                value={toPage}
                onChange={(e) => setToPage(parseInt(e.target.value) || 5)}
                min={fromPage + 1}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Quick Location Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Select Cities:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {['New York, USA', 'London, UK', 'Toronto, Canada', 'Sydney, Australia', 'Tokyo, Japan', 'Dubai, UAE', 'Singapore', 'Berlin, Germany'].map(city => (
                <button
                  type="button"
                  key={city}
                  onClick={() => handleQuickLocationClick(city)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedLocation === city 
                      ? 'bg-blue-600 text-white border border-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading || !selectedLocation}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : 'Search Companies'}
              </button>
              
              {selectedLocation && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">{selectedLocation}</span>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={downloadCSV}
              disabled={companies.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV ({companies.length})
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {selectedLocation && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Searching in <span className="text-blue-700">{selectedLocation}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Found {totalResults} companies • Showing {companies.length} • Batch {currentBatch}
              </p>
            </div>
            <div className="mt-2 md:mt-0">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {hasMore ? 'Scroll for more' : 'All loaded'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {companies.filter(c => c.hasReviews).length} active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TrustPilot URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company, index) => (
                <tr 
                  key={`${company.url}-${index}`} 
                  ref={index === companies.length - 1 ? lastElementRef : null}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {company.companyName || 'Unknown Company'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <a 
                        href={company.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
                        title={company.url}
                      >
                        {formatUrlForDisplay(company.url)}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                      company.hasReviews 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.hasReviews ? 'Active Reviews' : 'No Reviews'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => window.open(company.url, '_blank')}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(company.url)}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                        title="Copy URL"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading companies from {selectedLocation}...</p>
                <p className="text-sm text-gray-500">Batch {currentBatch}</p>
              </div>
            </div>
          )}
          
          {/* No Results */}
          {companies.length === 0 && !loading && selectedLocation && (
            <div className="text-center py-16">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No companies found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                No companies found in {selectedLocation} matching "{query}". Try adjusting your search query or select a different location.
              </p>
            </div>
          )}
          
          {/* Initial State */}
          {!selectedLocation && (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Select a location to begin</h3>
              <p className="mt-3 text-gray-600 max-w-md mx-auto">
                Choose a city from the dropdown above to find TrustPilot companies in that location.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg inline-block">
                <p className="text-sm text-blue-700 font-medium">💡 Tip: Cities are grouped by country for easy navigation</p>
              </div>
            </div>
          )}
          
          {/* End of Results */}
          {!hasMore && companies.length > 0 && (
            <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">All {totalResults} companies from {selectedLocation} have been loaded</span>
              </div>
              <p className="mt-2 text-gray-600">You've reached the end of the results</p>
            </div>
          )}
        </div>
      </div>

      {/* Information Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <p className="ml-3 text-gray-700">Select a city from the dropdown (grouped by country)</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <p className="ml-3 text-gray-700">Click "Search Companies" to fetch data for that city</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <p className="ml-3 text-gray-700">Scroll down to automatically load more companies</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">4</span>
                  </div>
                  <p className="ml-3 text-gray-700">Click "View" to visit company's TrustPilot page</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">5</span>
                  </div>
                  <p className="ml-3 text-gray-700">Use "Copy" to copy the URL to clipboard</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">6</span>
                  </div>
                  <p className="ml-3 text-gray-700">Download all results as CSV for further analysis</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white border border-gray-300 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Note:</span> Select a location from the dropdown to search for TrustPilot companies in that city. 
                You can use quick select buttons for popular cities or browse through the grouped dropdown.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TrustPilot);