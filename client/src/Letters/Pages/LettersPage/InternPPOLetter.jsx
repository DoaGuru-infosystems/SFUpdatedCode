import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import {
  Document, Page, Text, View, StyleSheet, Image, pdf, Font,
} from '@react-pdf/renderer';
import SearchableSelect from '../../Components/SearchableSelect';

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

  const sigName = formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory;
  const sigTitle = formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

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

const InternPPOLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [staticText, setStaticText] = useState(DEFAULT_STATIC);

  const [formData, setFormData] = useState({
    employeeName: '', employeeId: '', oldDesignation: '', newDesignation: '',
    newCTC: '', basicSalary: '', hra: '', allowances: '',
    joiningDate: '', acceptanceDate: '',
    currentDate: moment().tz('Asia/Kolkata').format('DD MMMM YYYY'),
    showSignature: true, gender: '', signatory: 'R.S. Pandey (CEO)'
  });

  const companyInfo = { name: 'DOAGURU INFOSYSTEMS' };

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://sf.doaguru.com/api/users');
        if (response.data && Array.isArray(response.data)) {
          setEmployees(response.data.filter(emp => emp.employment_status === 'active'));
        }
      } catch (error) { console.error('Error fetching employees:', error); }
      finally { setLoading(false); }
    };
    fetchEmployees();
  }, []);

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.full_name} (${emp.employee_id || 'No ID'}) - ${emp.department || 'N/A'}`
  }));

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.id == employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeName: employee.full_name || '',
        employeeId: employee.employee_id || '',
        oldDesignation: employee.designation || 'Intern',
        gender: employee.gender || '',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormatDate = (dateStr) => {
    if (!dateStr) return '';
    return moment.tz(dateStr, 'Asia/Kolkata').format('DD MMMM YYYY');
  };

  const handleStaticChange = (key, val) => setStaticText(prev => ({ ...prev, [key]: val }));

  // Inline editable span helper
  const rs = (key) => (
    <span
      contentEditable={isEditMode}
      suppressContentEditableWarning
      onBlur={e => handleStaticChange(key, e.currentTarget.textContent)}
      style={{
        outline: isEditMode ? '1px dashed #3b82f6' : 'none',
        padding: isEditMode ? '1px 3px' : 0,
        borderRadius: '2px',
        backgroundColor: isEditMode ? 'rgba(59,130,246,0.06)' : 'transparent',
        display: 'inline',
        cursor: isEditMode ? 'text' : 'default',
      }}
    >{staticText[key]}</span>
  );

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/intern-ppo-letters`, {
        ...formData, joiningDate: handleFormatDate(formData.joiningDate)
      }, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (err) { console.error('Failed to save to Database:', err); }

    const formattedData = {
      ...formData,
      joiningDate: handleFormatDate(formData.joiningDate),
      acceptanceDate: handleFormatDate(formData.acceptanceDate),
    };

    const instance = pdf(<InternPPOLetterPDF formData={formattedData} companyInfo={companyInfo} staticText={staticText} />);
    const blob = await instance.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.employeeName.replace(/ /g, '_')}_PPO_Letter.pdf`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const monthlyGross = formData.newCTC ? formData.newCTC / 12 : 0;
  const basic = formData.basicSalary ? parseFloat(formData.basicSalary) : 0;
  const hra = formData.hra ? parseFloat(formData.hra) : 0;
  const allowances = formData.allowances ? parseFloat(formData.allowances) : 0;
  const sigName = formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory;
  const sigTitle = formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

  // ---- PREVIEW PAGE ----
  if (showPreview) {
    return (
      <div className="dg-page-container">
        <div className="dg-page-header">
          <span className="dg-page-tag">Preview</span>
          <h1 className="dg-page-title">PPO Letter Preview</h1>
        </div>

        <div style={{ background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              PPO Letter — {formData.employeeName || 'Intern'}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: '0.45rem 0.9rem', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                ← Back
              </button>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={{ padding: '0.45rem 0.9rem', background: isEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '7px', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
              >
                {isEditMode ? '✓ Done Editing' : '✎ Edit Content'}
              </button>
              <button onClick={handleDownload} style={{ padding: '0.45rem 0.9rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '7px', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                Download PDF
              </button>
            </div>
          </div>

          {/* Edit hint */}
          {isEditMode && (
            <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.55rem 1.5rem', fontSize: '0.76rem', color: '#3b82f6' }}>
              ✎ Edit mode — click any <span style={{ borderBottom: '1px dashed #3b82f6' }}>underlined text</span> to edit. Name, dates, and salary figures are locked to form values.
            </div>
          )}

          {/* HTML Letter Preview */}
          <div style={{ background: '#f8f9fa', padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
              <img src={headerImg} alt="Header" style={{ width: '100%', height: '78px', objectFit: 'cover', display: 'block' }} />

              <div style={{ padding: '2.5rem', color: '#1a1a1a', fontSize: '0.9rem', lineHeight: 1.8 }}>
                <p style={{ textAlign: 'right', marginBottom: '1.5rem' }}>Date: {formData.currentDate}</p>

                <h2 style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'underline', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  {rs('heading')}
                </h2>

                <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
                  {rs('dearLabel')} <strong>{formData.employeeName || '[Name]'}</strong>,
                </p>

                <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
                  {rs('openingLine1')} <strong>{formData.newDesignation || '[New Designation]'}</strong> {rs('openingLine2')} <strong>{companyInfo.name}</strong>.{' '}
                  {rs('openingLine3')} <strong>{formData.oldDesignation || '[Old Designation]'}</strong>.
                </p>

                <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
                  {rs('transitionLine1')} <strong>{handleFormatDate(formData.joiningDate) || '[Joining Date]'}</strong>.{' '}
                  {rs('transitionLine2')} <strong>₹{parseInt(formData.newCTC || 0).toLocaleString('en-IN')} per annum</strong>.
                </p>

                <p style={{ marginBottom: '0.5rem', fontWeight: 700 }}>{rs('compensationHeading')}</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{rs('colComponent')}</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{rs('colMonthly')}</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{rs('colAnnual')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rs('rowBasic')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{basic.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(basic * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rs('rowHRA')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hra.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(hra * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rs('rowAllowances')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{allowances.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(allowances * 12).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rs('rowTotal')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{monthlyGross.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{Number(formData.newCTC || 0).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
                  {rs('closingLine1')} <strong>{handleFormatDate(formData.acceptanceDate) || '[Date]'}</strong>{rs('closingLine2')}
                </p>

                <p style={{ marginTop: '1rem' }}>For {companyInfo.name}</p>

                {formData.showSignature && (
                  <img src={Signature} alt="Signature" style={{ width: '6rem', marginTop: '0.75rem' }} />
                )}
                {!formData.showSignature && <div style={{ height: '3rem' }} />}

                <div style={{ width: '7rem', borderTop: '1px solid #333', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
                  <p style={{ fontWeight: 700 }}>{sigName}</p>
                  <p style={{ fontSize: '0.82rem' }}>{sigTitle}</p>
                </div>
              </div>

              <img src={footerImg} alt="Footer" style={{ width: '100%', height: '58px', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- FORM PAGE ----
  return (
    <div className="dg-page-container">
      <div className="dg-page-header">
        <span className="dg-page-tag">Interns</span>
        <h1 className="dg-page-title">Generate PPO Letter</h1>
      </div>

      <div className="dg-form-card">
        <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }}>
          <div className="dg-form-section">
            <p className="dg-form-section-title">Select Intern</p>
            <div className="dg-form-group">
              <label className="dg-label">Search and Select Intern</label>
              <SearchableSelect options={employeeOptions} onChange={handleEmployeeSelect} placeholder={loading ? "Loading Interns..." : "-- Select Intern --"} />
            </div>
          </div>

          <div className="dg-form-section">
            <p className="dg-form-section-title">Employee Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group"><label className="dg-label">Employee Name</label><input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Employee ID</label><input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Internship Designation</label><input type="text" name="oldDesignation" value={formData.oldDesignation} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">New Full-Time Designation</label><input type="text" name="newDesignation" value={formData.newDesignation} onChange={handleChange} className="dg-input" required /></div>
            </div>
          </div>

          <div className="dg-form-section">
            <p className="dg-form-section-title">Package & Timeline</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group"><label className="dg-label">New Annual CTC (₹)</label><input type="number" name="newCTC" value={formData.newCTC} onChange={handleChange} className="dg-input" step="500" min="0" required /></div>
              <div className="dg-form-group"><label className="dg-label">Basic Salary (Monthly ₹)</label><input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="dg-input" min="0" step="1" required /></div>
              <div className="dg-form-group"><label className="dg-label">HRA (Monthly ₹)</label><input type="number" name="hra" value={formData.hra} onChange={handleChange} className="dg-input" min="0" step="1" required /></div>
              <div className="dg-form-group"><label className="dg-label">Other Allowances (Monthly ₹)</label><input type="number" name="allowances" value={formData.allowances} onChange={handleChange} className="dg-input" min="0" step="1" required /></div>
              <div className="dg-form-group"><label className="dg-label">Date of Joining (Full-Time)</label><input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Acceptance Deadline</label><input type="date" name="acceptanceDate" value={formData.acceptanceDate} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Date of Issue</label><input type="text" name="currentDate" value={formData.currentDate} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group">
                <label className="dg-label">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="dg-input" required>
                  <option value="">-- Select Gender --</option>
                  <option value="He">Male (He/Him)</option>
                  <option value="She">Female (She/Her)</option>
                  <option value="They">Other (They/Them)</option>
                </select>
              </div>
              <div className="dg-form-group col-span-1 md:col-span-2 lg:col-span-4">
                <label className="dg-label">Signatory</label>
                <select name="signatory" value={formData.signatory} onChange={handleChange} className="dg-input" required>
                  <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                  <option value="HR Manager">HR Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dg-form-section">
            <p className="dg-form-section-title">Document Settings</p>
            <div className="dg-form-group flex items-center gap-3 mt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="showSignature" checked={formData.showSignature} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border-medium)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                <span className="ml-3 text-sm font-medium text-[var(--text-primary)]">Include Digital Signature</span>
              </label>
            </div>
          </div>

          <div className="dg-form-actions">
            <button type="submit" className="dg-btn-primary">Preview PPO Letter</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternPPOLetter;
