import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Loader2, Inbox, Download, Search, Calendar, Filter } from 'lucide-react';
import CLogo from "../../assets/images/CLogo.png";
import Signature from "../../assets/images/CEOSignature.png";
import headerImg from "../../assets/images/NewHeaderImage.png";
import footerImg from "../../assets/images/NewFotterImage.png";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  pdf,
} from '@react-pdf/renderer';

// Prevent hyphenation issues
Font.registerHyphenationCallback((word) => [String(word)]);

// PDF Styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 70,
    paddingHorizontal: 40,
    position: 'relative',
    fontSize: 10,
    fontFamily: 'Helvetica',
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
  headerImage: {
    width: '100%',
    height: '100%',
    marginBottom: 8,
  },
  footerImage: {
    width: '100%',
    height: '100%',
    marginTop: 8,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
    borderBottom: '1pt solid #ccc',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    color: '#666',
    width: 80,
  },
  value: {
    fontSize: 9,
    color: '#000',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: 5,
  },
  box: {
    border: '1pt solid #ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  boxHeader: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
  },
  earningsBox: {
    border: '1pt solid #ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  deductionsBox: {
    border: '1pt solid #ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  boxContent: {
    padding: 8,
  },
  netPayBox: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 10,
    textAlign: 'center',
    borderRadius: 4,
    marginBottom: 10,
  },
  netPayAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  netPayWords: {
    fontSize: 8,
    fontStyle: 'italic',
  },
  signatureSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  signatureImage: {
    width: 100,
    height: 50,
    marginBottom: 2,
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: '#000',
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 9,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  textCenter: {
    textAlign: 'center',
  },
  mb4: {
    marginBottom: 4,
  },
  mt8: {
    marginTop: 8,
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.03,
    width: 350,
    height: 350,
    zIndex: -1,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 70,
    zIndex: -1,
  }
});

// PDF Document Component
const SalarySlipPDF = ({ data }) => {
  const { formData, companyInfo, salaryData, monthNames, numberToWords } = data;

  const PageWithHeaderFooter = ({ children }) => (
    <Page size="A4" style={styles.page}>
      <View fixed style={styles.headerWrap}>
        <Image src={headerImg} style={styles.headerImage} />
      </View>
      <View fixed style={styles.footerWrap}>
        <Image src={footerImg} style={styles.footerImage} />
      </View>
      <View style={styles.watermarkContainer}>
        <Image src={CLogo} style={styles.watermark} />
      </View>
      <View style={styles.content}>{children}</View>
    </Page>
  );

  return (
    <Document>
      <PageWithHeaderFooter>
        <Text style={styles.title}>SALARY SLIP</Text>
        <Text style={styles.subtitle}>
          {monthNames[formData.month - 1]} {formData.year}
        </Text>

        <View style={styles.section}>
          <Text style={styles.bold}>{formData.employeeName}</Text>
          <Text>{formData.designation}</Text>
          <Text>Employee ID: DOAG000{formData.employeeId}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <View style={styles.box}>
              <Text style={styles.sectionTitle}>Employee Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Employee ID:</Text>
                <Text style={styles.value}>DOAG000{formData.employeeId}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Department:</Text>
                <Text style={styles.value}>{formData.department}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Joining:</Text>
                <Text style={styles.value}>{formData.dateOfJoining}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Working Days:</Text>
                <Text style={styles.value}>{salaryData.totalWorkingDays} days</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>LOP Days:</Text>
                <Text style={styles.value}>{formData.lopDays} days</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridCol}>
            <View style={styles.box}>
              <Text style={styles.sectionTitle}>Bank & Payment Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Bank Name:</Text>
                <Text style={styles.value}>{formData.bankName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Account No:</Text>
                <Text style={styles.value}>•••• {formData.accountNumber.slice(-4)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>PAN Number:</Text>
                <Text style={styles.value}>{formData.panNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Payment Mode:</Text>
                <Text style={styles.value}>Bank Transfer</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Net Payable:</Text>
                <Text style={[styles.value, styles.bold]}>Rs. {salaryData.netPay.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.textCenter]}>Salary Breakdown</Text>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <View style={styles.earningsBox}>
              <View style={styles.boxHeader}>
                <Text>EARNINGS</Text>
              </View>
              <View style={styles.boxContent}>
                <View style={styles.row}>
                  <Text style={styles.label}>Basic Salary:</Text>
                  <Text style={styles.value}>Rs. {salaryData.basicSalary.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>HRA:</Text>
                  <Text style={styles.value}>Rs. {salaryData.houseRentAllowance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Other Allowances:</Text>
                  <Text style={styles.value}>Rs. {salaryData.otherAllowances.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.row, styles.mt8]}>
                  <Text style={[styles.label, styles.bold]}>Total Earnings:</Text>
                  <Text style={[styles.value, styles.bold]}>Rs. {salaryData.grossSalary.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.gridCol}>
            <View style={styles.deductionsBox}>
              <View style={styles.boxHeader}>
                <Text>DEDUCTIONS</Text>
              </View>
              <View style={styles.boxContent}>
                <View style={styles.row}>
                  <Text style={styles.label}>Professional Tax:</Text>
                  <Text style={styles.value}>Rs. 0</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Income Tax (TDS):</Text>
                  <Text style={styles.value}>Rs. 0</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Provident Fund:</Text>
                  <Text style={styles.value}>Rs. {salaryData.pfDeduction.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Health Insurance:</Text>
                  <Text style={styles.value}>Rs. {salaryData.esiDeduction.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.row, styles.mt8]}>
                  <Text style={[styles.label, styles.bold]}>Total Deductions:</Text>
                  <Text style={[styles.value, styles.bold]}>Rs. {salaryData.totalDeductions.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.netPayBox}>
          <Text style={styles.mb4}>Net Payable Amount</Text>
          <Text style={styles.netPayAmount}>Rs. {salaryData.netPay.toLocaleString('en-IN')}</Text>
          <Text style={styles.netPayWords}>{numberToWords(salaryData.netPay)} Rupees Only</Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.mb4}>For {companyInfo.name}</Text>
          <Image src={Signature} style={styles.signatureImage} />
          <View style={styles.signatureLine}></View>
          <Text style={[styles.signatureText, styles.bold]}>
            {formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory}
          </Text>
          <Text style={styles.signatureText}>
            {formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory'}
          </Text>
        </View>

        <View style={[styles.section, styles.textCenter]}>
          <Text>For any discrepancies, please contact the HR department within 7 days.</Text>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const DownloadSalarySlip = () => {
  const [slips, setSlips] = useState([]);
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
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [allYears, setAllYears] = useState([]);

  // Fetch all years on mount
  useEffect(() => {
    const fetchAllYears = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/salary-slips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data.data || response.data || [];
        const unique = Array.from(new Set(data.map(s => s.year).filter(Boolean))).sort((a, b) => b - a);
        setAllYears(unique);
      } catch (err) {
        console.error('Error fetching years:', err);
      }
    };
    fetchAllYears();
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
  }, [debouncedSearch, startDate, endDate, month, year]);

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/salary-slips?page=${currentPage}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (month) url += `&month=${encodeURIComponent(month)}`;
      if (year) url += `&year=${encodeURIComponent(year)}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          setSlips(response.data.data);
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalItems || 0);
        } else if (Array.isArray(response.data)) {
          let filtered = response.data;
          if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            filtered = filtered.filter(item =>
              (item.employeeName && item.employeeName.toLowerCase().includes(searchLower)) ||
              (item.employeeId && String(item.employeeId).toLowerCase().includes(searchLower)) ||
              (item.month && item.month.toLowerCase().includes(searchLower)) ||
              (item.year && String(item.year).toLowerCase().includes(searchLower))
            );
          }
          if (startDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) >= new Date(`${startDate}T00:00:00`));
          }
          if (endDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) <= new Date(`${endDate}T23:59:59`));
          }
          if (month) {
            filtered = filtered.filter(item => item.month === month);
          }
          if (year) {
            filtered = filtered.filter(item => String(item.year) === String(year));
          }
          const total = filtered.length;
          const offset = (currentPage - 1) * limit;
          const slicedData = filtered.slice(offset, offset + limit);
          setSlips(slicedData);
          setTotalPages(Math.ceil(total / limit) || 1);
          setTotalItems(total);
        } else {
          setSlips([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } else {
        setSlips([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching salary slips:', err);
      setError('Failed to load salary slips.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, [currentPage, debouncedSearch, startDate, endDate, month, year]);
  const handleDownload = async (slip) => {
    let userDetails = {};
    try {
      const response = await axios.get('http://localhost:3000/api/users');
      if (response.data && Array.isArray(response.data)) {
        const found = response.data.find(emp => emp.employee_id == slip.employeeId || emp.full_name === slip.employeeName);
        if (found) {
          userDetails = found;
        }
      }
    } catch (e) {
      console.error("Error fetching user details for slip print:", e);
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    const monthNum = monthNames.indexOf(slip.month) + 1 || 1;

    const formData = {
      employeeName: slip.employeeName || '',
      employeeId: slip.employeeId || '',
      designation: userDetails.designation || 'Employee',
      department: userDetails.department || 'Development',
      bankName: userDetails.bank_name || 'HDFC Bank',
      accountNumber: userDetails.bank_account_number || 'N/A',
      dateOfJoining: userDetails.joiningDate ? new Date(userDetails.joiningDate).toISOString().split('T')[0] : 'N/A',
      panNumber: userDetails.pan_number || 'N/A',
      month: monthNum,
      year: slip.year || new Date().getFullYear(),
      lopDays: 0,
      signatory: slip.signatory || 'R.S. Pandey (CEO)',
    };

    const companyInfo = {
      name: 'DOAGURU INFOSYSTEMS',
      address: '1851, Write Town, jabalpur',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      country: 'India',
      phone: '+91 7440992424',
      email: 'info@doaguru.com',
      website: 'www.doaguru.com',
      gstin: '23AGLPP2890G1Z7',
    };

    const salaryData = {
      grossSalary: Number(slip.grossSalary || 0),
      totalWorkingDays: new Date(formData.year, formData.month, 0).getDate(),
      lopDays: 0,
      dailyRate: Number(slip.grossSalary || 0) / new Date(formData.year, formData.month, 0).getDate(),
      lopDeduction: 0,
      basicSalary: Number(slip.basic_salary || slip.grossSalary * 0.5),
      houseRentAllowance: Number(slip.hra || (slip.grossSalary * 0.5) * 0.4),
      otherAllowances: Number(slip.allowances || 0),
      pfDeduction: Number(slip.pf || 0),
      esiDeduction: Number(slip.esi || 0),
      totalDeductions: Number(slip.pf || 0) + Number(slip.esi || 0),
      netPay: Number(slip.netSalary || 0)
    };

    const numberToWords = (num) => {
      const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const formatTens = (n) => {
        if (n < 10) return single[n];
        if (n >= 10 && n < 20) return double[n - 10];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + single[n % 10] : '');
      };
      const rupees = Math.floor(num);
      const paise = Math.round((num - rupees) * 100);
      if (rupees === 0) return 'Zero Rupees Only';
      let result = '';
      let temp = rupees;
      if (temp >= 10000000) {
        const crores = Math.floor(temp / 10000000);
        result += formatTens(crores) + ' Crore';
        temp %= 10000000;
      }
      if (temp >= 100000) {
        const lakhs = Math.floor(temp / 100000);
        result += (result ? ' ' : '') + formatTens(lakhs) + ' Lakh';
        temp %= 100000;
      }
      if (temp >= 1000) {
        const thousands = Math.floor(temp / 1000);
        result += (result ? ' ' : '') + formatTens(thousands) + ' Thousand';
        temp %= 1000;
      }
      if (temp >= 100) {
        const hundreds = Math.floor(temp / 100);
        if (hundreds > 0) {
          result += (result ? ' ' : '') + single[hundreds] + ' Hundred';
          temp %= 100;
        }
      }
      if (temp > 0) {
        result += (result ? ' and ' : '') + formatTens(temp);
      }
      let finalResult = result + ' Rupees';
      if (paise > 0) {
        finalResult += ' and ' + formatTens(paise) + ' Paise';
      }
      return finalResult + ' Only';
    };

    const data = {
      formData,
      companyInfo,
      salaryData,
      monthNames,
      numberToWords
    };

    try {
      const instance = pdf();
      instance.updateContainer(<SalarySlipPDF data={data} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slip.employeeName.replace(' ', '_')}_salary_slip_${slip.month}_${slip.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Check console for details.');
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
        <p className="text-sm">Loading salary slips...</p>
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
          <FileText size={13} /> Salary Records
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Generated Salary Slips
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
            placeholder="Search name, ID, month, year..."
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
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All Months</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">All Years</option>
              {allYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {(search || startDate || endDate || month || year) && (
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setMonth('');
                setYear('');
              }}
              className="px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={`bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-200 animate-[fadeInUp_0.5s_ease] ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        {slips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-gray-700 dark:text-slate-300">No salary slips found</p>
            <p className="text-sm text-slate-400">Generate one from the Salary Slip page.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Employee ID', 'Month', 'Year', 'Gross Salary', 'Net Salary', 'Created On', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slips.map((slip) => (
                    <tr key={slip.id}
                      className="border-b border-gray-50 dark:border-white/[0.04] transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
                            {slip.employeeName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{slip.employeeName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{slip.employeeId || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20">
                          {slip.month || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{slip.year || '—'}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {slip.grossSalary ? `₹${Number(slip.grossSalary).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {slip.netSalary ? `₹${Number(slip.netSalary).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleDownload(slip)}
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
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${currentPage === p
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

export default DownloadSalarySlip;
