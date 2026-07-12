import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Loader2, Inbox, Download, Search, Calendar, Filter } from 'lucide-react';
import moment from 'moment-timezone';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  pdf,
  Font,
} from '@react-pdf/renderer';

// Assets
import imgS from '../../assets/images/CEOSignature.png';
import headerImg from '../../assets/images/NewHeaderImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';

// Prevent hyphenation issues
Font.registerHyphenationCallback((word) => [String(word)]);

// Helpers
const safe = (v) => (v === null || v === undefined ? '' : String(v));
const safeArray = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x.trim() !== '') : []);
const getPronouns = (gender) => {
  if (gender === 'He') return { subject: 'he', object: 'him', possessive: 'his' };
  if (gender === 'She') return { subject: 'she', object: 'her', possessive: 'her' };
  return { subject: 'they', object: 'them', possessive: 'their' };
};
const getSignatoryDetails = (signatory) => {
  if (signatory === 'HR Manager') {
    return { name: 'HR Department', title: 'HR Manager, DOAGuru Infosystems' };
  }
  if (safe(signatory).includes('CEO')) {
    return { name: 'R.S. Pandey', title: 'CEO, DOAGuru Infosystems' };
  }
  return {
    name: safe(signatory) || 'Authorized Signatory',
    title: 'Authorized Signatory',
  };
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 70,
    paddingHorizontal: 50,
    position: 'relative',
  },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  headerImg: { width: '100%', height: '100%', marginBottom: 8 },
  footerImg: { width: '100%', height: '100%', marginTop: 8 },
  content: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  title: {
    fontSize: 16,
    marginBottom: 22,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  signature: {
    width: 100,
    height: 50,
    marginVertical: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    marginRight: 8,
  },
});

const InternshipOfferLetterPDF = ({ data, staticText, visibleSections }) => {
  const d = {
    name: safe(data.name),
    address: safe(data.address),
    phoneNumber: safe(data.phoneNumber),
    email: safe(data.email),
    gender: safe(data.gender),
    startDate: safe(data.startDate),
    endDate: safe(data.endDate),
    position: safe(data.position),
    stipend: safe(data.stipend),
    mentorName: safe(data.mentorName),
    mentorContact: safe(data.mentorContact),
    offerReleaseDate: safe(data.offerReleaseDate),
    termsAndConditions: safeArray(data.termsAndConditions),
    signatory: safe(data.signatory),
  };
  const pronouns = getPronouns(d.gender);
  const signatoryDetails = getSignatoryDetails(d.signatory);

  let sectionCounter = 1;
  const getNum = () => `${sectionCounter++}. `;
  const getSubNum = () => `${sectionCounter - 1}.1 `;

  const PageWithHeaderFooter = ({ children }) => (
    <Page size="A4" style={styles.page}>
      <View fixed style={styles.headerWrap}>
        <Image src={headerImg} style={styles.headerImg} />
      </View>
      <View fixed style={styles.footerWrap}>
        <Image src={footerImg} style={styles.footerImg} />
      </View>
      <View style={styles.content}>{children}</View>
    </Page>
  );

  return (
    <Document>
      <PageWithHeaderFooter>
        <Text style={styles.title}>INTERNSHIP OFFER LETTER</Text>

        {d.offerReleaseDate ? (
          <Text style={{ fontSize: 11, marginBottom: 10 }}>
            <Text style={styles.bold}>Date: </Text>{d.offerReleaseDate}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text>To,</Text>
          <Text style={styles.bold}>{d.name}</Text>
          <Text style={styles.bold}>{d.address}</Text>
          <Text style={styles.bold}>{d.phoneNumber}</Text>
          {d.email ? (
            <Link src={`mailto:${d.email}`} style={styles.bold}>
              {d.email}
            </Link>
          ) : (
            <Text style={styles.bold}> </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{staticText.subject}</Text>
          <Text>{staticText.greeting}{d.name},</Text>
          <Text>
            {staticText.intro}<Text style={styles.bold}>{d.position}</Text>
          </Text>
        </View>

        {visibleSections.duration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.durationTitle}</Text>
            <Text>
              {staticText.durationText1}<Text style={styles.bold}>{d.startDate}</Text>{staticText.durationText2}<Text style={styles.bold}>{d.endDate}</Text>.
            </Text>
          </View>
        )}

        {visibleSections.pos && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.posTitle}</Text>
            <Text>
              {staticText.posText1}<Text style={styles.bold}>{d.position}</Text>{staticText.posText2}
            </Text>
            {visibleSections.perf && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 10, fontSize: 12 }]}>{getSubNum()}{staticText.perfTitle}</Text>
                <Text>
                  {staticText.perfText1}<Text style={styles.bold}>{d.name}</Text>{staticText.perfText2}{pronouns.possessive}{staticText.perfText3}
                </Text>
              </>
            )}
          </View>
        )}

        {visibleSections.stipend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.stipendTitle}</Text>
            <Text>
              {staticText.stipendText1}<Text style={styles.bold}>{d.stipend}</Text>.
            </Text>
          </View>
        )}

        {visibleSections.mentor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.mentorTitle}</Text>
            <Text>
              {staticText.mentorText1}<Text style={styles.bold}>{d.mentorName}</Text> ({d.mentorContact}).
            </Text>
          </View>
        )}

        {visibleSections.work && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.workTitle}</Text>
            <Text>{staticText.workText1}</Text>
          </View>
        )}

        {visibleSections.place && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.placeTitle}</Text>
            <Text>{staticText.placeText1}</Text>
          </View>
        )}

        {visibleSections.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getNum()}{staticText.termsTitle}</Text>
            {d.termsAndConditions.map((term, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>{index + 1}.</Text>
                <Text>{term}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text>{staticText.outro}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>Warm Regards,</Text>
          <Image src={imgS} style={styles.signature} />
          <Text>{signatoryDetails.name}</Text>
          <Text>{signatoryDetails.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acknowledgment:</Text>
          <Text>I, {d.name}, accept the above terms and conditions of internship.</Text>
          <View style={{ marginTop: 30 }}>
            <Text>Signature: ___________________</Text>
            <Text>Date: ________________</Text>
          </View>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const DownloadInternOfferLetter = () => {
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
  const [position, setPosition] = useState('');
  const [allPositions, setAllPositions] = useState([]);

  // Fetch all positions for select dropdown on mount
  useEffect(() => {
    const fetchAllPositions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/letter-routes/internship-offers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data.data || response.data || [];
        const unique = Array.from(new Set(data.map(l => l.position).filter(Boolean)));
        setAllPositions(unique);
      } catch (err) {
        console.error('Error fetching positions:', err);
      }
    };
    fetchAllPositions();
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
  }, [debouncedSearch, startDate, endDate, position]);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/letter-routes/internship-offers?page=${currentPage}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (position) url += `&position=${encodeURIComponent(position)}`;

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
              (item.email && item.email.toLowerCase().includes(searchLower)) ||
              (item.phoneNumber && item.phoneNumber.toLowerCase().includes(searchLower)) ||
              (item.position && item.position.toLowerCase().includes(searchLower))
            );
          }
          if (startDate) {
            filtered = filtered.filter(item => new Date(item.created_at || item.createdAt) >= new Date(`${startDate}T00:00:00`));
          }
          if (endDate) {
            filtered = filtered.filter(item => new Date(item.created_at || item.createdAt) <= new Date(`${endDate}T23:59:59`));
          }
          if (position) {
            filtered = filtered.filter(item => item.position === position);
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
      console.error('Error fetching intern offer letters:', err);
      setError('Failed to load intern offer letters.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentPage, debouncedSearch, startDate, endDate, position]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownload = async (letter) => {
    let parsedTerms = [];
    if (letter.termsAndConditions) {
      if (typeof letter.termsAndConditions === 'string') {
        try {
          parsedTerms = JSON.parse(letter.termsAndConditions);
        } catch (e) {
          parsedTerms = [letter.termsAndConditions];
        }
      } else if (Array.isArray(letter.termsAndConditions)) {
        parsedTerms = letter.termsAndConditions;
      }
    }

    const formatDate = (dateStr) =>
      dateStr ? moment.tz(dateStr, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY') : '';

    const data = {
      name: letter.name,
      address: letter.address,
      phoneNumber: letter.phoneNumber,
      email: letter.email,
      startDate: formatDate(letter.startDate),
      endDate: formatDate(letter.endDate),
      position: letter.position,
      stipend: letter.stipend,
      mentorName: letter.mentorName,
      mentorContact: letter.mentorContact,
      gender: letter.gender,
      signatory: letter.signatory,
      offerReleaseDate: formatDate(letter.offerReleaseDate || letter.created_at),
      termsAndConditions: parsedTerms,
    };

    const staticText = {
      subject: 'Subject: Offer of Internship',
      greeting: 'Dear ',
      intro: 'We are pleased to offer you an internship position at DOAGuru Infosystems as ',
      durationTitle: 'Internship Duration',
      durationText1: 'Your internship will be from ',
      durationText2: ' to ',
      posTitle: 'Position & Department',
      posText1: 'You will be designated as ',
      posText2: ', and you will report to the assigned mentor.',
      perfTitle: 'Performance Expectation',
      perfText1: 'Throughout the internship, ',
      perfText2: ' is expected to complete assigned tasks and demonstrate ',
      perfText3: ' progress regularly.',
      stipendTitle: 'Stipend',
      stipendText1: 'You will receive a monthly stipend of ',
      mentorTitle: 'Mentor Details',
      mentorText1: 'You will be assigned ',
      workTitle: 'Working Days',
      workText1: 'You will work 6 days a week, Monday to Saturday, 10:00 AM to 7:00 PM.',
      placeTitle: 'Place of Work',
      placeText1: 'DOAGuru Infosystems, Jabalpur (M.P.), or as assigned.',
      termsTitle: 'Terms & Conditions',
      outro: 'We look forward to your valuable contribution. Please sign and return a copy as confirmation.',
    };

    const visibleSections = {
      duration: true,
      pos: true,
      perf: true,
      stipend: true,
      mentor: true,
      work: true,
      place: true,
      terms: true
    };

    try {
      const instance = pdf();
      instance.updateContainer(<InternshipOfferLetterPDF data={data} staticText={staticText} visibleSections={visibleSections} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${letter.name.replace(' ', '_')}_internship_offer_letter.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading && isInitialLoad) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm">Loading intern offer letters...</p>
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
          Intern Offer Letters
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
            placeholder="Search name, email, phone, position..."
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
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All Positions</option>
              {allPositions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {(search || startDate || endDate || position) && (
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setPosition('');
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
            <p className="font-semibold text-gray-700 dark:text-slate-300">No intern offer letters found</p>
            <p className="text-sm text-slate-400">Generate one from the Intern Offer Letter page.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Email', 'Position', 'Start Date', 'End Date', 'Stipend', 'Created On', 'Actions'].map((h) => (
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
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{letter.email || '—'}</td>
                      <td className="px-4 py-3">
                        {letter.position ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap text-primary-light bg-primary/10 border border-primary/20">
                            {letter.position}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.startDate ? new Date(letter.startDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.endDate ? new Date(letter.endDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.stipend ? `₹${Number(letter.stipend).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {letter.created_at ? new Date(letter.created_at).toLocaleDateString('en-IN') : '—'}
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

export default DownloadInternOfferLetter;
