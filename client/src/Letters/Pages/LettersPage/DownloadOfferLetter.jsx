import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit2, FileText, Mail, Loader2, Inbox, Download, Search, Calendar, Filter } from 'lucide-react';

const DownloadOfferLetter = () => {
  const [offerLetters, setOfferLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const limit = 10;
  const navigate = useNavigate();

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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/offer-letters`, {
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

  const fetchOfferLetters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/offer-letters?page=${currentPage}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (designation) url += `&designation=${encodeURIComponent(designation)}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          setOfferLetters(response.data.data);
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalItems || 0);
        } else if (Array.isArray(response.data)) {
          let filtered = response.data;
          if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            filtered = filtered.filter(item => 
              (item.name && item.name.toLowerCase().includes(searchLower)) ||
              (item.email && item.email.toLowerCase().includes(searchLower)) ||
              (item.phoneNumber && item.phoneNumber.toLowerCase().includes(searchLower)) ||
              (item.designation && item.designation.toLowerCase().includes(searchLower))
            );
          }
          if (startDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) >= new Date(`${startDate}T00:00:00`));
          }
          if (endDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) <= new Date(`${endDate}T23:59:59`));
          }
          if (designation) {
            filtered = filtered.filter(item => item.designation === designation);
          }
          const total = filtered.length;
          const offset = (currentPage - 1) * limit;
          const slicedData = filtered.slice(offset, offset + limit);
          setOfferLetters(slicedData);
          setTotalPages(Math.ceil(total / limit) || 1);
          setTotalItems(total);
        } else {
          setOfferLetters([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } else {
        setOfferLetters([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching offer letters:', err);
      setError('Failed to load offer letters. Please try again later.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchOfferLetters();
  }, [currentPage, debouncedSearch, startDate, endDate, designation]);

  const handleEdit = (id) => navigate(`/Offer-Letter-Genrate/${id}`);
  const handleGenerateLetter = (id) => navigate(`/Offer-Letter-Genrate/${id}?preview=true`);
  const handleSendEmail = (id) => console.log(`Sending email for letter ID: ${id}`);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && isInitialLoad) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm">Loading offer letters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 py-8 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl" role="alert">
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
          Generated Offer Letters
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {totalItems} total records — sorted by newest first
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-72">
          {loading ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          )}
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
        {offerLetters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-gray-700 dark:text-slate-300">No offer letters found</p>
            <p className="text-sm text-slate-400">Create a new offer letter to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Email', 'Mobile No.', 'Designation', 'Joining Date', 'Created On', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offerLetters.map((letter) => (
                    <tr key={letter.id}
                      className="border-b border-gray-50 dark:border-white/[0.04] transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.02]">

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
                            {letter.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{letter.name || '—'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.phoneNumber || '—'}</td>

                      <td className="px-5 py-4">
                        {letter.designation ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20">
                            {letter.designation}
                          </span>
                        ) : '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.joiningDate ? new Date(letter.joiningDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.createdAt ? new Date(letter.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button onClick={() => handleEdit(letter.id)} title="Edit"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-light bg-primary/10 border border-primary/20 cursor-pointer transition-all duration-200 hover:bg-primary/20 hover:-translate-y-px">
                            <Edit2 size={14} />
                          </button>
                          {/* Generate / Preview */}
                          <button onClick={() => handleGenerateLetter(letter.id)} title="Generate Letter"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all duration-200 hover:bg-emerald-500/20 hover:-translate-y-px">
                            <Download size={14} />
                          </button>
                          {/* Email */}
                          <button onClick={() => handleSendEmail(letter.id)} title="Send Email"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sky-400 bg-sky-400/10 border border-sky-400/20 cursor-pointer transition-all duration-200 hover:bg-sky-400/20 hover:-translate-y-px">
                            <Mail size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
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

export default DownloadOfferLetter;
