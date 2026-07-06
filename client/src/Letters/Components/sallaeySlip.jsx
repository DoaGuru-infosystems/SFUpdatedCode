import React, { useState, useEffect, useRef } from 'react';
import CLogo from "../assets/images/CLogo.png";
import Signature from "../assets/images/CEOSignature.png";
import headerImg from "../assets/images/NewHeaderImage.png";
import footerImg from "../assets/images/NewFotterImage.png";
import axios from 'axios';
import SearchableSelect from './SearchableSelect';
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

// ---- IMPORTANT: prevent hyphenation issues on e-mails/long tokens ----
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

  // Page component with fixed header and footer
  const PageWithHeaderFooter = ({ children }) => (
    <Page size="A4" style={styles.page}>
      {/* Fixed header */}
      <View fixed style={styles.headerWrap}>
        <Image src={headerImg} style={styles.headerImage} />
      </View>

      {/* Fixed footer */}
      <View fixed style={styles.footerWrap}>
        <Image src={footerImg} style={styles.footerImage} />
      </View>

      {/* Watermark */}
      <View style={styles.watermarkContainer}>
        <Image src={CLogo} style={styles.watermark} />
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </Page>
  );

  return (
    <Document>
      <PageWithHeaderFooter>
        {/* Title */}
        <Text style={styles.title}>SALARY SLIP</Text>
        <Text style={styles.subtitle}>
          {monthNames[formData.month - 1]} {formData.year}
        </Text>

        {/* Employee Header */}
        <View style={styles.section}>
          <Text style={styles.bold}>{formData.employeeName}</Text>
          <Text>{formData.designation}</Text>
          <Text>Employee ID: DOAG000{formData.employeeId}</Text>
        </View>

        {/* Employee & Bank Details */}
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

        {/* Salary Breakdown */}
        <Text style={[styles.sectionTitle, styles.textCenter]}>Salary Breakdown</Text>

        <View style={styles.grid}>
          {/* Earnings */}
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
                <View style={styles.row}>
                  <Text style={styles.label}></Text>
                  <Text style={styles.value}></Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}></Text>
                  <Text style={styles.value}></Text>
                </View>
                <View style={[styles.row, styles.mt8]}>
                  <Text style={[styles.label, styles.bold]}>Total Earnings:</Text>
                  <Text style={[styles.value, styles.bold]}>Rs. {salaryData.grossSalary.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Deductions */}
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
                <View style={styles.row}>
                  <Text style={styles.label}></Text>
                  <Text style={styles.value}></Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}></Text>
                  <Text style={styles.value}></Text>
                </View>
                <View style={[styles.row, styles.mt8]}>
                  <Text style={[styles.label, styles.bold]}>Total Deductions:</Text>
                  <Text style={[styles.value, styles.bold]}>Rs. {salaryData.totalDeductions.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPayBox}>
          <Text style={styles.mb4}>Net Payable Amount</Text>
          <Text style={styles.netPayAmount}>Rs. {salaryData.netPay.toLocaleString('en-IN')}</Text>
          <Text style={styles.netPayWords}>{numberToWords(salaryData.netPay)} Rupees Only</Text>
        </View>

        {/* Signature */}
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

        {/* Footer Note */}
        <View style={[styles.section, styles.textCenter]}>
          <Text>For any discrepancies, please contact the HR department within 7 days.</Text>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const SalarySlip = () => {
  const [showSlip, setShowSlip] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  // Company Information
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

  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    designation: '',
    department: '',
    bankName: '',
    accountNumber: '',
    dateOfJoining: '',
    panNumber: '',
    grossSalary: '',
    basicSalary: '',
    hra: '',
    allowances: '',
    pf: 0,
    esi: 0,
    lopDays: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    gender: '',
    signatory: 'R.S. Pandey (CEO)',
  });

  // Calculate total working days in the selected month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Fetch employees from API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/users');
      if (response.data && Array.isArray(response.data)) {
        // Filter active employees only
        const activeEmployees = response.data.filter(emp => emp.employment_status === 'active');
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill form data when employee is selected
  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.id == employeeId);
    if (employee) {
      setSelectedEmployee(employee);

      const gSal = employee.salary_amount || 0;
      const bSal = Math.round(gSal * 0.5);
      const hraSal = Math.round(bSal * 0.4);
      const allowSal = Math.max(0, gSal - bSal - hraSal);

      setFormData(prev => ({
        ...prev,
        employeeName: employee.full_name || '',
        employeeId: employee.employee_id || '',
        designation: employee.designation || '',
        department: employee.department || '',
        bankName: '',
        accountNumber: employee.bank_account_number || '',
        dateOfJoining: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
        panNumber: employee.pan_number || '',
        grossSalary: gSal || '',
        basicSalary: bSal || '',
        hra: hraSal || '',
        allowances: allowSal || '',
        gender: employee.gender || '',
      }));
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.full_name} (${emp.employee_id || 'No ID'}) - ${emp.department || 'N/A'}`
  }));

  const totalWorkingDays = getDaysInMonth(formData.month, formData.year);

  // Update form data when input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['grossSalary', 'basicSalary', 'hra', 'allowances', 'pf', 'esi', 'lopDays', 'month', 'year'].includes(name)
        ? (value === '' ? '' : Number(value))
        : value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSlip(true);
    window.scrollTo(0, 0);
  };

  // Reset form to show the input fields again
  const handleEdit = () => {
    setShowSlip(false);
  };

  // PDF Generation Function
  const handlePDFDownload = async () => {
    const data = {
      formData,
      companyInfo,
      salaryData,
      monthNames,
      numberToWords,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/salary-slips`, {
        employeeName: formData.employeeName,
        employeeId: formData.employeeId,
        month: monthNames[formData.month - 1],
        year: formData.year,
        grossSalary: formData.grossSalary,
        netSalary: salaryData.netPay,
        basicSalary: parseInt(formData.basicSalary) || 0,
        hra: parseInt(formData.hra) || 0,
        allowances: parseInt(formData.allowances) || 0,
        pf: parseInt(formData.pf) || 0,
        esi: parseInt(formData.esi) || 0,
        gender: formData.gender,
        signatory: formData.signatory
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failure saving to Database:', err);
    }

    try {
      // Build the PDF instance
      const instance = pdf();
      instance.updateContainer(<SalarySlipPDF data={data} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.employeeName.replace(' ', '_')}_salary_slip_${monthNames[formData.month - 1]}_${formData.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Check console for details.');
    }
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Reusable Detail Item Component
  const DetailItem = ({ label, value, isHighlighted = false }) => (
    <div className="flex">
      <span className={`w-36 text-gray-600 dark:text-slate-400 ${isHighlighted ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <span className={`${isHighlighted ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  );

  // Salary Item Component
  const SalaryItem = ({ label, amount, isTotal = false }) => (
    <div className={`flex justify-between items-center ${isTotal ? 'pt-2' : 'pb-2'}`}>
      <span className={`${isTotal ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
        {label}
      </span>
      <span className={`font-mono ${isTotal ? 'text-lg font-bold text-indigo-700 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
        ₹{Number(amount || 0).toLocaleString('en-IN')}
      </span>
    </div>
  );

  // Get month names
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Convert number to words for net pay (Indian Numbering System)
  const numberToWords = (num) => {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatTens = (num) => {
      if (num < 10) return single[num];
      if (num >= 10 && num < 20) return double[num - 10];
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + single[num % 10] : '');
    };

    // Handle decimal part (paise)
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    if (rupees === 0) {
      return 'Zero Rupees' + (paise > 0 ? ` and ${formatTens(paise)} Paise` : '') + ' Only';
    }

    let result = '';

    // Crores
    if (rupees >= 10000000) {
      const crores = Math.floor(rupees / 10000000);
      result += formatTens(crores) + ' Crore';
      const remaining = rupees % 10000000;
      if (remaining > 0) result += ' ' + numberToWords(remaining);
    }
    // Lakhs
    else if (rupees >= 100000) {
      const lakhs = Math.floor(rupees / 100000);
      result += formatTens(lakhs) + ' Lakh';
      const remaining = rupees % 100000;
      if (remaining > 0) result += ' ' + numberToWords(remaining);
    }
    // Thousands
    else if (rupees >= 1000) {
      const thousands = Math.floor(rupees / 1000);
      result += formatTens(thousands) + ' Thousand';
      const remaining = rupees % 1000;
      if (remaining > 0) result += ' ' + numberToWords(remaining);
    }
    // Hundreds
    else if (rupees >= 100) {
      const hundreds = Math.floor(rupees / 100);
      result += single[hundreds] + ' Hundred';
      const remaining = rupees % 100;
      if (remaining > 0) result += ' and ' + formatTens(remaining);
    }
    // Tens and ones
    else {
      result = formatTens(rupees);
    }

    // Add 'Rupees' word
    let finalResult = result + ' Rupees';

    // Add paise if any
    if (paise > 0) {
      finalResult += ' and ' + formatTens(paise) + ' Paise';
    }

    return finalResult + ' Only';
  };

  const salaryData = {
    grossSalary: Number(formData.grossSalary || 0),
    totalWorkingDays: Number(totalWorkingDays || 0),
    lopDays: Number(formData.lopDays || 0),

    // Calculate daily rate based on gross salary and working days
    get dailyRate() {
      return this.grossSalary / this.totalWorkingDays;
    },

    // Calculate LOP amount based on daily rate and LOP days
    get lopDeduction() {
      return Math.round(this.dailyRate * this.lopDays);
    },

    get basicSalary() {
      return formData.basicSalary || 0;
    },

    get houseRentAllowance() {
      return formData.hra || 0;
    },

    get otherAllowances() {
      return formData.allowances || 0;
    },

    get pfDeduction() {
      return formData.pf || 0;
    },

    get esiDeduction() {
      return formData.esi || 0;
    },

    get totalDeductions() {
      return this.esiDeduction + this.pfDeduction + this.lopDeduction;
    },

    get netPay() {
      const totalEarnings = this.basicSalary + this.houseRentAllowance + this.otherAllowances;
      return totalEarnings - this.totalDeductions;
    }
  };



  // Show form if slip is not generated yet
  if (!showSlip) {
    return (
      <div className="dg-page-container">
        <div className="dg-page-header">
          <span className="dg-page-tag">Salary</span>
          <h1 className="dg-page-title">Generate Salary Slip</h1>
        </div>

        <div className="dg-form-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Fill in the details to generate the <strong>employee salary slip</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="dg-form-section">
              <p className="dg-form-section-title">Employee Selection</p>
              <div className="dg-form-group">
                <label className="dg-label">Search and Select Employee</label>
                <SearchableSelect
                  options={employeeOptions}
                  value={selectedEmployee ? String(selectedEmployee.id) : ''}
                  onChange={handleEmployeeSelect}
                  placeholder={loading ? "Loading employees..." : "-- Select Employee --"}
                />
              </div>
            </div>

            <div className="dg-form-section">
              <p className="dg-form-section-title">Employee Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                <div className="dg-form-group">
                  <label className="dg-label">Employee Name</label>
                  <input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.full_name} required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Employee ID</label>
                  <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.employee_id} required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.designation} required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.department} required />
                </div>
              </div>
            </div>

            <div className="dg-form-section">
              <p className="dg-form-section-title">Bank Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                <div className="dg-form-group">
                  <label className="dg-label">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="dg-input" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.bank_account_number} required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">PAN Number</label>
                  <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.pan_number} required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Date of Joining</label>
                  <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} className="dg-input" readOnly={selectedEmployee && selectedEmployee.joiningDate} required />
                </div>
              </div>
            </div>

            <div className="dg-form-section">
              <p className="dg-form-section-title">Salary Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                <div className="dg-form-group">
                  <label className="dg-label">Monthly Gross Salary (₹)</label>
                  <input type="number" name="grossSalary" value={formData.grossSalary} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Basic Salary (₹)</label>
                  <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">House Rent Allowance (₹)</label>
                  <input type="number" name="hra" value={formData.hra} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Other Allowances (₹)</label>
                  <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">PF Deduction (₹)</label>
                  <input type="number" name="pf" value={formData.pf} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">ESI Deduction (₹)</label>
                  <input type="number" name="esi" value={formData.esi} onChange={handleChange} className="dg-input" min="0" step="1" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="dg-input" required>
                    <option value="">-- Select Gender --</option>
                    <option value="He">Male (He/Him)</option>
                    <option value="She">Female (She/Her)</option>
                    <option value="They">Other (They/Them)</option>
                  </select>
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Signatory</label>
                  <select name="signatory" value={formData.signatory} onChange={handleChange} className="dg-input" required>
                    <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                    <option value="HR Manager">HR Manager</option>
                  </select>
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Loss of Pay (LOP) Days</label>
                  <input type="number" name="lopDays" value={formData.lopDays} onChange={handleChange} className="dg-input" min="0" max="31" step="0.5" required />
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Month</label>
                  <select name="month" value={formData.month} onChange={handleChange} className="dg-input" required>
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="dg-form-group">
                  <label className="dg-label">Year</label>
                  <input type="number" name="year" value={formData.year} onChange={handleChange} className="dg-input" min="2000" max="2100" />
                </div>
              </div>
            </div>

            <div className="dg-form-actions">
              <button type="submit" className="dg-btn-secondary">
                Generate Salary Slip
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Salary Slip Display
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .bg-gradient-to-br {
            background: white !important;
          }
          .text-indigo-600, .text-indigo-700, .text-blue-600 {
            color: black !important;
          }
          .bg-indigo-600, .bg-blue-600, .bg-gradient-to-r {
            background: #1f2937 !important;
          }
          .hover\\:bg-indigo-700:hover, .hover\\:bg-gray-900:hover {
            background: #1f2937 !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .p-4, .p-6, .p-8 {
            padding: 0.25rem !important;
          }
          .mb-6, .mb-8, .mb-12 {
            margin-bottom: 0.5rem !important;
          }
          .mt-6, .mt-8, .mt-12 {
            margin-top: 0.5rem !important;
          }
          .gap-4, .gap-6 {
            gap: 0.25rem !important;
          }
          .text-2xl, .text-3xl {
            font-size: 1rem !important;
          }
          .text-xl {
            font-size: 0.875rem !important;
          }
          .h-16 {
            height: 2rem !important;
          }
          .h-12 {
            height: 1.5rem !important;
          }
        }
      `}</style>
      <div className="dg-page-container">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">Salary Slip Generator</h1>
            <p className="text-gray-600 dark:text-slate-400">Generated on {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          {/* Salary Slip Card */}
          <div className="bg-white dark:bg-brand-card rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-white/[0.06] overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            {/* Company Header */}
            <div className="bg-white dark:bg-brand-card p-4 border-b border-gray-200 dark:border-white/[0.06]">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={CLogo}
                    alt="Company Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-center md:text-left">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{companyInfo.name}</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{companyInfo.address}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{companyInfo.city}, {companyInfo.state}, {companyInfo.country}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                      {/* <span className="font-medium">CIN:</span> {companyInfo.cin} |  */}
                      <span className="font-medium">GSTIN:</span> {companyInfo.gstin} |
                      {/* <span className="font-medium">PAN:</span> {companyInfo.pan} */}
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-center">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg">
                    <h2 className="text-xl font-bold">SALARY SLIP</h2>
                    <p className="text-sm flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {monthNames[formData.month - 1]} {formData.year}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-4 border-b border-gray-200 dark:border-white/[0.06]">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-2 md:mb-0">
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white">{formData.employeeName}</h1>
                  <p className="text-gray-600 dark:text-slate-400">{formData.designation}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-500">Employee ID: {formData.employeeId}</p>
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400 text-center md:text-right">
                  <p><span className="font-medium">Date of Joining:</span> {formatDate(formData.dateOfJoining)}</p>
                  <p><span className="font-medium">Department:</span> {formData.department}</p>
                  <p><span className="font-medium">PAN Number:</span> {formData.panNumber}</p>
                </div>
              </div>
            </div>

            {/* Employee & Bank Details */}
            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Details */}
                <div className="bg-white dark:bg-brand-card p-4 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-white/[0.06]">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-white/[0.06] flex items-center">
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Employee Details
                  </h3>
                  <div className="space-y-2">
                    <DetailItem label="Employee ID" value={formData.employeeId} />
                    <DetailItem label="Department" value={formData.department} />
                    <DetailItem label="Date of Joining" value={formatDate(formData.dateOfJoining)} />
                    <DetailItem label="Working Days" value={`${totalWorkingDays} days`} />
                    <DetailItem label="LOP Days" value={`${formData.lopDays} days`} />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white dark:bg-brand-card p-4 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-white/[0.06]">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-white/[0.06] flex items-center">
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Bank & Payment Details
                  </h3>
                  <div className="space-y-2">
                    <DetailItem label="Bank Name" value={formData.bankName} />
                    <DetailItem label="Account Number" value={`•••• ${formData.accountNumber.slice(-4)}`} />
                    <DetailItem label="PAN Number" value={formData.panNumber} />
                    <DetailItem label="Payment Mode" value="Bank Transfer" />
                    <DetailItem label="Net Payable" value={`₹${salaryData.netPay.toLocaleString('en-IN')}`} isHighlighted />
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Breakdown */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">Salary Breakdown</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Earnings */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl overflow-hidden border border-gray-300 dark:border-white/[0.1]">
                  <div className="bg-gray-800 p-4 text-white font-semibold text-center">
                    EARNINGS
                  </div>
                  <div className="p-3">
                    <div className="space-y-2">
                      <SalaryItem label="Basic Salary" amount={salaryData.basicSalary} />
                      <SalaryItem label="House Rent Allowance (HRA)" amount={salaryData.houseRentAllowance} />
                      <SalaryItem label="Conveyance Allowance" amount={salaryData.conveyanceAllowance} />
                      <SalaryItem label="Medical Allowance" amount={salaryData.medicalAllowance} />
                      <SalaryItem label="Special Allowance" amount={salaryData.specialAllowance} />
                      <div className="pt-2 mt-2 border-t border-gray-300 dark:border-white/[0.1]">
                        <SalaryItem label="Total Earnings" amount={salaryData.grossSalary} isTotal />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl overflow-hidden border border-gray-300 dark:border-white/[0.1]">
                  <div className="bg-gray-800 p-4 text-white font-semibold text-center">
                    DEDUCTIONS
                  </div>
                  <div className="p-3">
                    <div className="space-y-2">
                      <SalaryItem label="Professional Tax" amount={0} />
                      <SalaryItem label="Income Tax (TDS)" amount={0} />
                      <SalaryItem label="Provident Fund (PF)" amount={salaryData.pfDeduction} />
                      <SalaryItem label="Health Insurance (ESI)" amount={salaryData.esiDeduction} />
                      <div className="h-4"></div> {/* Spacer for alignment */}
                      <div className="pt-2 mt-2 border-t border-gray-300 dark:border-white/[0.1]">
                        <SalaryItem label="Total Deductions" amount={salaryData.totalDeductions} isTotal />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-gray-800 rounded-xl p-4 text-white mb-6">
                <div className="flex flex-col items-center text-center">
                  <span className="text-gray-300 mb-2">Net Payable Amount</span>
                  <div className="text-2xl font-bold mb-2">₹{salaryData.netPay.toLocaleString('en-IN')}</div>
                  <div className="text-gray-300 text-sm">
                    {numberToWords(salaryData.netPay)} Rupees Only
                  </div>
                </div>
              </div>

              {/* Footer */}

              {/* Signature Section */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/[0.06]">
                <div className="flex flex-col items-end">
                  <div className="mb-2 text-sm text-gray-500 dark:text-slate-400">
                    For {companyInfo.name}
                  </div>
                  <img src={Signature} className="h-12" alt="Flowbite Logo" />
                  <div className="mb-2 w-48 h-0.5 bg-gray-300 dark:bg-slate-600"></div>
                  <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Authorized Signatory
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-500">
                    Director
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.06] text-center text-sm text-gray-500 dark:text-slate-500">
                <p>For any discrepancies, please contact the HR department within 7 days.</p>
              </div>
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handlePDFDownload}
                  className="px-6 py-3 bg-gray-800 dark:bg-indigo-600 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 border border-gray-300 dark:border-white/[0.1] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalarySlip;
