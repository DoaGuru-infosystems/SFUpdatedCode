import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Loader2, Inbox, Download, Trash2, Search, Calendar, Filter } from 'lucide-react';

const DownloadExperienceLetter = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const limit = 10;

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [designation, setDesignation] = useState('');
  const [allDesignations, setAllDesignations] = useState([]);

  // Fetch all designations for select dropdown on mount
  useEffect(() => {
    const fetchAllDesignations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/letter-routes/experience-letters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data.data || response.data || [];
        const unique = Array.from(new Set(data.map(l => l.designation).filter(Boolean)));
        setAllDesignations(unique);
      } catch (err) {
        console.error('Error fetching designations:', err);
      }
    };
    fetchAllDesignations();
  }, []);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, startDate, endDate, designation]);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/letter-routes/experience-letters?page=${currentPage}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (designation) url += `&designation=${encodeURIComponent(designation)}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          setLetters(response.data.data);
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalItems || 0);
        } else if (Array.isArray(response.data)) {
          let filtered = response.data;
          if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            filtered = filtered.filter(item => 
              (item.name && item.name.toLowerCase().includes(searchLower)) ||
              (item.designation && item.designation.toLowerCase().includes(searchLower))
            );
          }
          if (startDate) {
            filtered = filtered.filter(item => new Date(item.joining_date || item.createdAt) >= new Date(`${startDate}T00:00:00`));
          }
          if (endDate) {
            filtered = filtered.filter(item => new Date(item.joining_date || item.createdAt) <= new Date(`${endDate}T23:59:59`));
          }
          if (designation) {
            filtered = filtered.filter(item => item.designation === designation);
          }
          const total = filtered.length;
          const offset = (currentPage - 1) * limit;
          const slicedData = filtered.slice(offset, offset + limit);
          setLetters(slicedData);
          setTotalPages(Math.ceil(total / limit) || 1);
          setTotalItems(total);
        } else {
          setLetters([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } else {
        setLetters([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching experience letters:', err);
      setError('Failed to load experience letters.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentPage, debouncedSearch, startDate, endDate, designation]);

  const handleDownload = (id) => {
    window.open(`${process.env.REACT_APP_API_URL}/api/letter-routes/generatePDF/${id}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this experience letter record?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/letter-routes/experience-letters/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (letters.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchLetters();
        }
      } catch (err) {
        console.error('Failed to delete experience letter:', err);
        alert('Failed to delete experience letter.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && isInitialLoad) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm">Loading experience letters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 py-8 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl" role="alert">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-6 animate-[fadeInUp_0.4s_ease]">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-light uppercase tracking-widest mb-2">
          <FileText size={13} /> Employee Records
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Employee Experience Letters
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {totalItems} total records — sorted by newest first
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-72">
          {loading ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          )}
          <input
            type="text"
            placeholder="Search name, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>

          <div className="relative">
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All Designations</option>
              {allDesignations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {(search || startDate || endDate || designation) && (
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setDesignation('');
              }}
              className="px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={`bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-200 animate-[fadeInUp_0.5s_ease] ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        {letters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-gray-700 dark:text-slate-300">No experience letters found</p>
            <p className="text-sm text-slate-400">Generate one from the Experience Letter page.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Designation', 'Joining Date', 'Resignation Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {letters.map((letter) => (
                    <tr key={letter.id}
                      className="border-b border-gray-50 dark:border-white/[0.04] transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
                            {letter.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{letter.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {letter.designation ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-primary-light bg-primary/10 border border-primary/20">
                            {letter.designation}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.joining_date ? new Date(letter.joining_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.resignation_date ? new Date(letter.resignation_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownload(letter.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all duration-200 hover:bg-emerald-500/20 hover:-translate-y-px">
                            <Download size={13} /> Download
                          </button>
                          <button onClick={() => handleDelete(letter.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-500/10 border border-red-500/20 cursor-pointer transition-all duration-200 hover:bg-red-500/20 hover:-translate-y-px">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{((currentPage - 1) * limit) + 1}</span> to{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(currentPage * limit, totalItems)}
                </span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> records
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-card text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      currentPage === p
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-card text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-card text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadExperienceLetter;
