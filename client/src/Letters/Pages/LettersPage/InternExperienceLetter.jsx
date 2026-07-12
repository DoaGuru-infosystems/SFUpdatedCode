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
  page: { paddingTop: 80, paddingBottom: 70, paddingHorizontal: 50, position: 'relative', fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5, color: '#333' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  footerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  headerImg: { width: '100%', height: '100%' },
  footerImg: { width: '100%', height: '100%' },
  content: { marginTop: 20 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000', textDecoration: 'underline' },
  dateRight: { textAlign: 'right', marginBottom: 20 },
  paragraph: { marginBottom: 15, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  signatureSection: { marginTop: 40 },
  signatureImage: { width: 100, height: 50, marginBottom: 5 },
  signatureLine: { width: 120, height: 1, backgroundColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10 },
  watermarkContainer: { position: 'absolute', top: 80, left: 0, right: 0, bottom: 70, zIndex: -1, justifyContent: 'center', alignItems: 'center' },
  watermark: { width: 350, height: 350, opacity: 0.04 }
});

// PDF Component - renders from staticText + formData
const InternExperienceLetterPDF = ({ formData, companyInfo, staticText }) => {
  const g = formData.gender;
  const their = g === 'He' ? 'his' : g === 'She' ? 'her' : 'their';
  const they_cap = g === 'He' ? 'He' : g === 'She' ? 'She' : 'They';
  const were = g === 'They' ? 'were' : 'was';
  const his_her_cap = g === 'He' ? 'His' : g === 'She' ? 'Her' : 'Their';

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
        <Text style={pdfStyles.dateRight}>Date: {formData.currentDate}</Text>
        <Text style={pdfStyles.title}>{staticText.heading}</Text>

        <Text style={pdfStyles.paragraph}>
          {staticText.certifyIntro} <Text style={pdfStyles.bold}>{formData.employeeName}</Text> (Employee ID: {formData.employeeId}) {staticText.certifyCompleted} <Text style={pdfStyles.bold}>{companyInfo.name}</Text>.{' '}
          {they_cap} {staticText.workedAs} <Text style={pdfStyles.bold}>{formData.designation}</Text> {staticText.inThe} {formData.department} {staticText.department} {staticText.fromText} <Text style={pdfStyles.bold}>{formData.startDate}</Text> {staticText.toText} <Text style={pdfStyles.bold}>{formData.endDate}</Text>.
        </Text>

        <Text style={pdfStyles.paragraph}>
          {staticText.tenureIntro} {their} {staticText.tenureWith} {their === 'his' ? 'he' : their === 'her' ? 'she' : 'they'} {were} {staticText.tenureQualities} {his_her_cap} {staticText.contributions}
        </Text>

        <Text style={pdfStyles.paragraph}>
          {staticText.wishText} <Text style={pdfStyles.bold}>{formData.employeeName}</Text> {staticText.wishEnd} {their} {staticText.futureEnd}
        </Text>

        <View style={pdfStyles.signatureSection}>
          <Text style={{ marginBottom: 10 }}>For {companyInfo.name}</Text>
          {formData.showSignature && <Image src={Signature} style={pdfStyles.signatureImage} />}
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
  heading: 'TO WHOMSOEVER IT MAY CONCERN',
  certifyIntro: 'This is to certify that',
  certifyCompleted: 'has successfully completed their internship with',
  workedAs: 'worked as an',
  inThe: 'in the',
  department: 'Department',
  fromText: 'from',
  toText: 'to',
  tenureIntro: 'During',
  tenureWith: 'tenure with us,',
  tenureQualities: 'found to be hardworking, diligent, and eager to learn.',
  contributions: 'contributions to the assigned projects were valuable and demonstrated a solid understanding of the concepts involved.',
  wishText: 'We wish',
  wishEnd: 'the very best in all',
  futureEnd: 'future endeavors.',
};

const InternExperienceLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [staticText, setStaticText] = useState(DEFAULT_STATIC);

  const [formData, setFormData] = useState({
    employeeName: '', employeeId: '', designation: '', department: '',
    startDate: '', endDate: '', gender: '',
    currentDate: moment().tz('Asia/Kolkata').format('DD MMMM YYYY'),
    showSignature: true, signatory: 'R.S. Pandey (CEO)'
  });

  const companyInfo = { name: 'DOAGURU INFOSYSTEMS' };

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/users');
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
        designation: employee.designation || 'Intern',
        department: employee.department || '',
        startDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
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
      await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/letter-routes/intern-experience-letters`, {
        ...formData,
        startDate: handleFormatDate(formData.startDate),
        endDate: handleFormatDate(formData.endDate)
      }, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (err) { console.error('Failed to save to Database:', err); }

    const formattedData = { ...formData, startDate: handleFormatDate(formData.startDate), endDate: handleFormatDate(formData.endDate) };
    const instance = pdf(<InternExperienceLetterPDF formData={formattedData} companyInfo={companyInfo} staticText={staticText} />);
    const blob = await instance.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.employeeName.replace(/ /g, '_')}_Experience_Letter.pdf`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---- Pronouns for preview ----
  const g = formData.gender;
  const their = g === 'He' ? 'his' : g === 'She' ? 'her' : 'their';
  const they = g === 'He' ? 'he' : g === 'She' ? 'she' : 'they';
  const they_cap = g === 'He' ? 'He' : g === 'She' ? 'She' : 'They';
  const were = g === 'They' ? 'were' : 'was';
  const his_her_cap = g === 'He' ? 'His' : g === 'She' ? 'Her' : 'Their';
  const sigName = formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory;
  const sigTitle = formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

  // ---- PREVIEW PAGE ----
  if (showPreview) {
    return (
      <div className="dg-page-container">
        <div className="dg-page-header">
          <span className="dg-page-tag">Preview</span>
          <h1 className="dg-page-title">Experience Letter Preview</h1>
        </div>

        <div style={{ background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Experience Letter — {formData.employeeName || 'Intern'}
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
              ✎ Edit mode — click any <span style={{ borderBottom: '1px dashed #3b82f6' }}>underlined text</span> to edit. Name, ID, dates, and designation are locked to form values.
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
                  {rs('certifyIntro')} <strong>{formData.employeeName || '[Name]'}</strong> (Employee ID: {formData.employeeId || '[ID]'}) {rs('certifyCompleted')} <strong>{companyInfo.name}</strong>.{' '}
                  {they_cap} {rs('workedAs')} <strong>{formData.designation || '[Designation]'}</strong> {rs('inThe')} {formData.department || '[Department]'} {rs('department')} {rs('fromText')} <strong>{handleFormatDate(formData.startDate) || '[Start Date]'}</strong> {rs('toText')} <strong>{handleFormatDate(formData.endDate) || '[End Date]'}</strong>.
                </p>

                <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
                  {rs('tenureIntro')} {their} {rs('tenureWith')} {they} {were} {rs('tenureQualities')} {his_her_cap} {rs('contributions')}
                </p>

                <p style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
                  {rs('wishText')} <strong>{formData.employeeName || '[Name]'}</strong> {rs('wishEnd')} {their} {rs('futureEnd')}
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
        <h1 className="dg-page-title">Generate Intern Experience Letter</h1>
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
            <p className="dg-form-section-title">Intern Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group"><label className="dg-label">Employee Name</label><input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Employee ID</label><input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Designation</label><input type="text" name="designation" value={formData.designation} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Department</label><input type="text" name="department" value={formData.department} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group">
                <label className="dg-label">Pronouns</label>
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
            <p className="dg-form-section-title">Tenure Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group"><label className="dg-label">Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="dg-input" required /></div>
              <div className="dg-form-group"><label className="dg-label">Date of Issue</label><input type="text" name="currentDate" value={formData.currentDate} onChange={handleChange} className="dg-input" required /></div>
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
            <button type="submit" className="dg-btn-primary">Preview Experience Letter</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternExperienceLetter;
