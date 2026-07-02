import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Plus, Edit2, Download, FileText, Inbox, Loader2 } from 'lucide-react';

const ViewOfferLettersPage = () => {
  const [offerLetters, setOfferLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const filterType = queryParams.get('filter');

  useEffect(() => {
    const fetchOfferLetters = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/offer-letters`);
        setOfferLetters(response.data);
      } catch (error) {
        console.error('Failed to fetch offer letters:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfferLetters();
  }, []);

  const handleDownload = (id) => {
    window.open(`${process.env.REACT_APP_API_URL}/api/download-pdf/${id}`, '_blank');
  };

  const filtered = offerLetters.filter((l) => {
    const matchesSearch =
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.designation?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'this-month') {
      if (!l.createdAt) return false;
      const d = new Date(l.createdAt); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (filterType === 'designation') return !!l.designation && l.designation.trim() !== '';
    if (filterType === 'recent') {
      if (!l.createdAt) return false;
      return Math.ceil(Math.abs(new Date() - new Date(l.createdAt)) / (1000 * 60 * 60 * 24)) <= 7;
    }
    return true;
  });

  const getFilterLabel = () => {
    switch (filterType) {
      case 'this-month': return 'This Month';
      case 'designation': return 'With Designation';
      case 'recent': return 'Recent 7 Days';
      default: return '';
    }
  };

  return (
    <div className="flex-1 px-6 py-8 max-w-[1100px] mx-auto w-full">

      {/* Header */}
      <div className="mb-6 animate-[fadeInUp_0.4s_ease]">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-light uppercase tracking-widest mb-2">
          <FileText size={13} /> Records
        </span>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Offer Letters</h1>
            {filterType && filterType !== 'all' && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {getFilterLabel()}
                <button
                  onClick={() => navigate('/task/letters/report')}
                  className="bg-transparent border-none cursor-pointer text-primary-light hover:text-white transition-colors p-0 flex items-center">
                  <X size={13} />
                </button>
              </span>
            )}
          </div>
          <Link to="/task/letters/Offer-Letter-Genrate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)]"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)" }}>
            <Plus size={16} /> New Offer Letter
          </Link>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl overflow-hidden animate-[fadeInUp_0.5s_ease]">

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-slate-400 text-sm font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors p-0 flex items-center">
              <X size={15} />
            </button>
          )}
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm">Loading records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-gray-700 dark:text-slate-300">No records found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {search ? 'Try adjusting your search' : 'Generate your first offer letter to get started'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                  {['#', 'Candidate Name', 'Designation', 'Joining Date', 'Offer Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((letter, idx) => (
                  <tr key={letter.id}
                    className="border-b border-gray-50 dark:border-white/[0.04] transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary-light flex-shrink-0">
                          {letter.name ? letter.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{letter.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20">
                        {letter.designation || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.joiningDate || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.offerReleaseDate || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(letter.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all duration-200 hover:bg-emerald-500/20 hover:-translate-y-px">
                          <Download size={13} /> Download
                        </button>
                        <Link to={`/Offer-Letter-Genrate/${letter.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20 no-underline transition-all duration-200 hover:bg-primary/20 hover:-translate-y-px">
                          <Edit2 size={13} /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewOfferLettersPage;
