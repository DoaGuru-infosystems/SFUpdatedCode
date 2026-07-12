import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Loader2, Inbox, Download, Search, Calendar, Filter } from 'lucide-react';
import moment from 'moment-timezone';
import {
  Document, Page, Text, View, StyleSheet, Image, pdf, Font,
} from '@react-pdf/renderer';

import CLogo from "../../assets/images/CLogo.png";
import Signature from "../../assets/images/CEOSignature.png";
import headerImg from "../../assets/images/NewHeaderImage.png";
import footerImg from "../../assets/images/NewFotterImage.png";

Font.registerHyphenationCallback((word) => [String(word)]);

const pdfStyles = StyleSheet.create({
  page: { paddingTop: 80, paddingBottom: 70, paddingHorizontal: 50, position: 'relative', fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5, color: '#333' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  footerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  headerImg: { width: '100%', height: '100%' },
  footerImg: { width: '100%', height: '100%' },
  content: { marginTop: 15 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000', textDecoration: 'underline' },
  bold: { fontWeight: 'bold' },
  dateRight: { textAlign: 'right', marginBottom: 10 },
  paragraph: { marginBottom: 10, textAlign: 'justify' },
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginTop: 10, marginBottom: 10 },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: { width: "50%", borderStyle: "solid", borderBottomWidth: 1, borderRightWidth: 1, backgroundColor: '#f0f0f0', padding: 5 },
  tableCol: { width: "50%", borderStyle: "solid", borderBottomWidth: 1, borderRightWidth: 1, padding: 5 },
  tableCellHeader: { margin: "auto", fontSize: 10, fontWeight: 500 },
  tableCell: { margin: "auto", fontSize: 10 },
  signatureSection: { marginTop: 25 },
  signatureImage: { width: 100, height: 50, marginBottom: 5 },
  signatureLine: { width: 120, height: 1, backgroundColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10 },
  watermarkContainer: { position: 'absolute', top: 80, left: 0, right: 0, bottom: 70, zIndex: -1, justifyContent: 'center', alignItems: 'center' },
  watermark: { width: 350, height: 350, opacity: 0.04 }
});

const InternPPOLetterPDF = ({ formData, companyInfo, staticText }) => {
  const monthlyGross = formData.newCTC ? formData.newCTC / 12 : 0;
  const basic = formData.basicSalary ? parseFloat(formData.basicSalary) : 0;
  const hra = formData.hra ? parseFloat(formData.hra) : 0;
  const allowances = formData.allowances ? parseFloat(formData.allowances) : 0;

  const sigName = formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory?.includes('CEO') ? 'R.S. Pandey' : formData.signatory;
  const sigTitle = formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory?.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

  const PageWithHeaderFooter = ({ children }) => (
    <Page size="A4" style={pdfStyles.page}>
      <View fixed style={pdfStyles.headerWrap}><Image src={headerImg} style={pdfStyles.headerImg} /></View>
      <View fixed style={pdfStyles.footerWrap}><Image src={footerImg} style={pdfStyles.footerImg} /></View>
      <View fixed style={pdfStyles.watermarkContainer}><Image src={CLogo} style={pdfStyles.watermark} /></View>
      <View style={pdfStyles.content}>{children}</View>
    </Page>
  );

  return (
    <Document>
      <PageWithHeaderFooter>
        <Text style={pdfStyles.dateRight}>{staticText.dateLabel} {formData.currentDate}</Text>
        <Text style={pdfStyles.title}>{staticText.heading}</Text>

        <Text style={pdfStyles.paragraph}>{staticText.dearLabel} <Text style={pdfStyles.bold}>{formData.employeeName}</Text>,</Text>

        <Text style={pdfStyles.paragraph}>
          {staticText.openingLine1} <Text style={pdfStyles.bold}>{formData.newDesignation}</Text> {staticText.openingLine2} <Text style={pdfStyles.bold}>{companyInfo.name}</Text>.{' '}
          {staticText.openingLine3} <Text style={pdfStyles.bold}>{formData.oldDesignation}</Text>.
        </Text>

        <Text style={pdfStyles.paragraph}>
          {staticText.transitionLine1} <Text style={pdfStyles.bold}>{formData.joiningDate}</Text>.{' '}
          {staticText.transitionLine2} <Text style={pdfStyles.bold}>₹{parseInt(formData.newCTC).toLocaleString('en-IN')} per annum</Text>.
        </Text>

        <Text style={[pdfStyles.paragraph, pdfStyles.bold]}>{staticText.compensationHeading}</Text>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableCellHeader}>{staticText.colComponent}</Text></View>
            <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableCellHeader}>{staticText.colMonthly}</Text></View>
            <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableCellHeader}>{staticText.colAnnual}</Text></View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{staticText.rowBasic}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{basic.toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{(basic * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{staticText.rowHRA}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{hra.toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{(hra * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{staticText.rowAllowances}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{allowances.toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{(allowances * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={[pdfStyles.tableColHeader, {backgroundColor: '#e2e8f0'}]}><Text style={[pdfStyles.tableCellHeader, pdfStyles.bold]}>{staticText.rowTotal}</Text></View>
            <View style={[pdfStyles.tableColHeader, {backgroundColor: '#e2e8f0'}]}><Text style={[pdfStyles.tableCellHeader, pdfStyles.bold]}>{monthlyGross.toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
            <View style={[pdfStyles.tableColHeader, {backgroundColor: '#e2e8f0'}]}><Text style={[pdfStyles.tableCellHeader, pdfStyles.bold]}>{Number(formData.newCTC).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text></View>
          </View>
        </View>

        <Text style={pdfStyles.paragraph}>
          {staticText.closingLine1} <Text style={pdfStyles.bold}>{formData.acceptanceDate}</Text>{staticText.closingLine2}
        </Text>

        <View style={pdfStyles.signatureSection}>
          <Text style={{ marginBottom: 10 }}>For {companyInfo.name}</Text>
          {formData.showSignature && (<Image src={Signature} style={pdfStyles.signatureImage} />)}
          {!formData.showSignature && <View style={{ height: 50 }} />}
          <View style={pdfStyles.signatureLine}></View>
          <Text style={[pdfStyles.signatureText, pdfStyles.bold]}>{sigName}</Text>
          <Text style={pdfStyles.signatureText}>{sigTitle}</Text>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const DEFAULT_STATIC = {
  heading: 'PRE-PLACEMENT OFFER (PPO)',
  dearLabel: 'Dear',
  dateLabel: 'Date:',
  openingLine1: 'We are pleased to offer you the full-time position of',
  openingLine2: 'at',
  openingLine3: 'This Pre-Placement Offer (PPO) is being extended to you based on your excellent performance during your internship with us as an',
  transitionLine1: 'Your transition to a full-time employee will be effective from',
  transitionLine2: 'Your Total Cost to Company (CTC) will be',
  compensationHeading: 'Compensation Breakdown:',
  colComponent: 'Salary Component',
  colMonthly: 'Monthly (₹)',
  colAnnual: 'Annual (₹)',
  rowBasic: 'Basic Salary',
  rowHRA: 'House Rent Allowance (HRA)',
  rowAllowances: 'Other Allowances',
  rowTotal: 'Total Gross Salary',
  closingLine1: 'We look forward to your continued contribution to DOAGuru Infosystems. Please review the terms, sign, and return a copy of this letter by',
  closingLine2: ' to indicate your acceptance of this offer.',
};

const DownloadInternPPOLetter = () => {
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
  const [oldDesignation, setOldDesignation] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [allOldDesignations, setAllOldDesignations] = useState([]);
  const [allNewDesignations, setAllNewDesignations] = useState([]);

  // Fetch all old and new designations on mount
  useEffect(() => {
    const fetchAllFilterOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/letter-routes/get-intern-ppo-letters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data.data || response.data || [];
        setAllOldDesignations(Array.from(new Set(data.map(l => l.oldDesignation).filter(Boolean))));
        setAllNewDesignations(Array.from(new Set(data.map(l => l.newDesignation).filter(Boolean))));
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchAllFilterOptions();
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
  }, [debouncedSearch, startDate, endDate, oldDesignation, newDesignation]);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/letter-routes/get-intern-ppo-letters?page=${currentPage}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (oldDesignation) url += `&oldDesignation=${encodeURIComponent(oldDesignation)}`;
      if (newDesignation) url += `&newDesignation=${encodeURIComponent(newDesignation)}`;

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
              (item.employeeName && item.employeeName.toLowerCase().includes(searchLower)) ||
              (item.oldDesignation && item.oldDesignation.toLowerCase().includes(searchLower)) ||
              (item.newDesignation && item.newDesignation.toLowerCase().includes(searchLower))
            );
          }
          if (startDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) >= new Date(`${startDate}T00:00:00`));
          }
          if (endDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) <= new Date(`${endDate}T23:59:59`));
          }
          if (oldDesignation) {
            filtered = filtered.filter(item => item.oldDesignation === oldDesignation);
          }
          if (newDesignation) {
            filtered = filtered.filter(item => item.newDesignation === newDesignation);
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
      console.error('Error fetching PPO letters:', err);
      setError('Failed to load PPO letters.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentPage, debouncedSearch, startDate, endDate, oldDesignation, newDesignation]);

  const handleDownload = async (letter) => {
    const handleFormatDate = (dateStr) => {
      if (!dateStr) return '';
      return moment.tz(dateStr, 'Asia/Kolkata').format('DD MMMM YYYY');
    };

    const companyInfo = { name: 'DOAGURU INFOSYSTEMS' };

    const formData = {
      employeeName: letter.employeeName,
      employeeId: letter.employeeId,
      oldDesignation: letter.oldDesignation,
      newDesignation: letter.newDesignation,
      newCTC: letter.newCTC,
      basicSalary: letter.basicSalary,
      hra: letter.hra,
      allowances: letter.allowances,
      joiningDate: handleFormatDate(letter.joiningDate),
      acceptanceDate: handleFormatDate(letter.acceptanceDate),
      currentDate: handleFormatDate(letter.currentDate || letter.createdAt),
      showSignature: letter.showSignature !== false && letter.showSignature !== 0,
      gender: letter.gender,
      signatory: letter.signatory || 'R.S. Pandey (CEO)'
    };

    try {
      const instance = pdf(<InternPPOLetterPDF formData={formData} companyInfo={companyInfo} staticText={DEFAULT_STATIC} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${letter.employeeName.replace(/ /g, '_')}_PPO_Letter.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
        <p className="text-sm">Loading PPO letters...</p>
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
          <FileText size={13} /> Intern Records
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Pre-Placement Offer (PPO) Letters
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
            placeholder="Search name, ID, designation..."
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
              value={oldDesignation}
              onChange={(e) => setOldDesignation(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All Old Designations</option>
              {allOldDesignations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative">
            <select
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All New Designations</option>
              {allNewDesignations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {(search || startDate || endDate || oldDesignation || newDesignation) && (
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setOldDesignation('');
                setNewDesignation('');
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
            <p className="font-semibold text-gray-700 dark:text-slate-300">No PPO letters found</p>
            <p className="text-sm text-slate-400">Generate one from the PPO Letter page.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Employee ID', 'Old Designation', 'New Designation', 'Annual CTC', 'Joining Date', 'Created On', 'Actions'].map((h) => (
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
                            {letter.employeeName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{letter.employeeName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.employeeId || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.oldDesignation || '—'}</td>
                      <td className="px-4 py-3">
                        {letter.newDesignation ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                            {letter.newDesignation}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {letter.newCTC ? `₹${Number(letter.newCTC).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.joiningDate ? new Date(letter.joiningDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.createdAt ? new Date(letter.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDownload(letter)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all duration-200 hover:bg-emerald-500/20 hover:-translate-y-px">
                          <Download size={13} /> Download
                        </button>
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

export default DownloadInternPPOLetter;
