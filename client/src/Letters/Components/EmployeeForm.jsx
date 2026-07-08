import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from '@react-pdf/renderer';
import SearchableSelect from './SearchableSelect';
import CLogo from '../assets/images/CLogo.png';
import Signature from '../assets/images/CEOSignature.png';
import headerImg from '../assets/images/NewHeaderImage.png';
import footerImg from '../assets/images/NewFotterImage.png';

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 70,
    paddingHorizontal: 50,
    position: 'relative',
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
    color: '#333',
  },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  footerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  headerImage: { width: '100%', height: '100%', marginBottom: 8 },
  footerImage: { width: '100%', height: '100%', marginTop: 8 },
  content: { marginTop: 20 },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
    textDecoration: 'underline',
  },
  dateRight: { textAlign: 'right', marginBottom: 20 },
  paragraph: { marginBottom: 15, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  signatureSection: { marginTop: 40 },
  signatureImage: { width: 100, height: 50, marginBottom: 5 },
  signatureLine: { width: 120, height: 1, backgroundColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10 },
  watermarkContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 70,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: { width: 350, height: 350, opacity: 0.04 },
});

const normalizeGender = (gender = '') => {
  const value = gender.toLowerCase();
  if (value === 'he' || value === 'male') return 'He';
  if (value === 'she' || value === 'female') return 'She';
  if (value === 'they' || value === 'other') return 'They';
  return '';
};

const getPronouns = (gender) => {
  const normalized = normalizeGender(gender);
  if (normalized === 'He') return { subject: 'he', possessive: 'his', be: 'was' };
  if (normalized === 'She') return { subject: 'she', possessive: 'her', be: 'was' };
  return { subject: 'they', possessive: 'their', be: 'were' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const EmployeeExperienceLetterPDF = ({ data, staticText }) => {
  const { formData, companyInfo } = data;
  const pronouns = getPronouns(formData.gender);
  const issueDate = formData.currentDate || new Date().toLocaleDateString('en-GB');

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View fixed style={pdfStyles.headerWrap}>
          <Image src={headerImg} style={pdfStyles.headerImage} />
        </View>
        <View fixed style={pdfStyles.footerWrap}>
          <Image src={footerImg} style={pdfStyles.footerImage} />
        </View>
        <View fixed style={pdfStyles.watermarkContainer}>
          <Image src={CLogo} style={pdfStyles.watermark} />
        </View>

        <View style={pdfStyles.content}>
          <Text style={pdfStyles.dateRight}>Date: {issueDate}</Text>
          <Text style={pdfStyles.title}>{staticText.title}</Text>

          <Text style={pdfStyles.paragraph}>
            {staticText.certifyPrefix}<Text style={pdfStyles.bold}>{formData.name}</Text>
            {formData.employeeCode ? ` (Employee ID: ${formData.employeeCode})` : ''}{staticText.employedWith}
            <Text style={pdfStyles.bold}>{companyInfo.name}</Text>{staticText.asA}
            <Text style={pdfStyles.bold}>{formData.designation}</Text>{staticText.from}
            <Text style={pdfStyles.bold}>{formData.joining_date}</Text>{staticText.to}
            <Text style={pdfStyles.bold}>{formData.resignation_date}</Text>.
          </Text>

          <Text style={pdfStyles.paragraph}>
            During {pronouns.possessive}{staticText.perfMid1}{pronouns.subject} {pronouns.be}{staticText.perfMid2}
            {pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)}{staticText.perfSuffix}
          </Text>

          <Text style={pdfStyles.paragraph}>
            {staticText.wishPrefix}<Text style={pdfStyles.bold}>{formData.name}</Text>{staticText.wishSuffix}
          </Text>

          <View style={pdfStyles.signatureSection}>
            <Text style={{ marginBottom: 10 }}>For {companyInfo.name}</Text>
            <Image src={Signature} style={pdfStyles.signatureImage} />
            <View style={pdfStyles.signatureLine}></View>
            <Text style={[pdfStyles.signatureText, pdfStyles.bold]}>
              {formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory}
            </Text>
            <Text style={pdfStyles.signatureText}>
              {formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const DEFAULT_STATIC = {
  title: 'EXPERIENCE CERTIFICATE',
  certifyPrefix: 'This is to certify that ',
  employedWith: ' was employed with ',
  asA: ' as a ',
  from: ' from ',
  to: ' to ',
  perfMid1: ' tenure with us, ',
  perfMid2: ` found to be sincere, hardworking, technically skilled, and professional 
in approach. He demonstrated strong problem-solving abilities, quick learning capability, dedication 
toward assigned responsibilities, and the ability to work effectively in a team environment. He actively 
contributed to software development,  debugging, and project execution 
tasks.` ,
  perfSuffix: ' performance and conduct were satisfactory.',
  wishPrefix: 'We wish ',
  wishSuffix: ' success in all future endeavors.'
};

const EmployeeForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    designation: '',
    joining_date: '',
    resignation_date: '',
    gender: '',
    signatory: 'R.S. Pandey (CEO)',
    currentDate: new Date().toLocaleDateString('en-GB'),
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [staticText, setStaticText] = useState(DEFAULT_STATIC);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/users');
        if (response.data && Array.isArray(response.data)) {
          setEmployees(response.data.filter(emp => emp.employment_status === 'active'));
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.full_name} (${emp.employee_id || 'No ID'}) - ${emp.department || 'N/A'}`
  }));

  const handleEmployeeSelect = (id) => {
    const emp = employees.find(e => e.id == id);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        name: emp.full_name || '',
        employeeCode: emp.employee_id || '',
        designation: emp.designation || '',
        joining_date: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
        gender: normalizeGender(emp.gender),
      }));
    }
  };

  const handlePrint = async () => {
    try {
      const formattedData = {
        ...formData,
        joining_date: formatDate(formData.joining_date),
        resignation_date: formatDate(formData.resignation_date),
      };
      const companyInfo = { name: 'DOAGURU INFOSYSTEMS' };
      const instance = pdf(<EmployeeExperienceLetterPDF data={{ formData: formattedData, companyInfo }} staticText={staticText} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experience_letter_${formData.name || 'employee'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Error generating PDF');
    }
  };

  const handleGeneratePreview = async () => {
    if (!formData.name || !formData.designation || !formData.joining_date || !formData.resignation_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/saveEmployee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await response.json();
      } else {
        const errorData = await response.json();
        alert('Error saving employee data: ' + errorData.message);
        return;
      }
    } catch (error) {
      console.error('Error saving employee data:', error);
      return;
    }

    setShowPreview(true);
  };

  const renderStatic = (key) => (
    <span
      contentEditable={isEditMode}
      suppressContentEditableWarning
      onBlur={(e) => {
        const nextText = e.currentTarget?.textContent ?? '';
        setStaticText((prev) => ({ ...prev, [key]: nextText }));
      }}
      style={{
        outline: isEditMode ? '1px dashed #3b82f6' : 'none',
        padding: isEditMode ? '1px 3px' : 0,
        borderRadius: '2px',
        backgroundColor: isEditMode ? 'rgba(59,130,246,0.06)' : 'transparent',
        display: 'inline',
        cursor: isEditMode ? 'text' : 'default',
        minWidth: '20px'
      }}
    >
      {staticText[key]}
    </span>
  );

  const pronouns = getPronouns(formData.gender);

  return (
    <div className="dg-page-container">
      <div className="dg-page-header">
        <span className="dg-page-tag">Experience</span>
        <h1 className="dg-page-title">Generate Experience Letter</h1>
      </div>

      <div className="dg-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Fill in the details to generate the <strong>employee experience letter</strong>
          </p>
        </div>

        <form>
          <div className="dg-form-section">
            <p className="dg-form-section-title">Select Employee</p>
            <div className="dg-form-group">
              <label className="dg-label">Search and Select Employee</label>
              <SearchableSelect
                options={employeeOptions}
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
                <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Designation</label>
                <input type="text" placeholder="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Employee ID</label>
                <input type="text" placeholder="Employee ID" value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} className="dg-input" />
              </div>
            </div>

            <p className="dg-form-section-title" style={{ marginTop: '1rem' }}>Tenure Dates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group">
                <label className="dg-label">Joining Date</label>
                <input type="date" value={formData.joining_date} onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Resignation Date</label>
                <input type="date" value={formData.resignation_date} onChange={(e) => setFormData({ ...formData, resignation_date: e.target.value })} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Gender (Pronouns)</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="dg-input" required>
                  <option value="">-- Select Gender --</option>
                  <option value="He">Male (He/Him)</option>
                  <option value="She">Female (She/Her)</option>
                  <option value="They">Other (They/Them)</option>
                </select>
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Signatory</label>
                <select value={formData.signatory} onChange={(e) => setFormData({ ...formData, signatory: e.target.value })} className="dg-input" required>
                  <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                  <option value="HR Manager">HR Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dg-form-actions">
            <button type="button" onClick={handleGeneratePreview} className="dg-btn-primary">
              Preview Letter
            </button>
          </div>
        </form>
      </div>

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', width: '95vw', maxWidth: '900px', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Experience Letter Preview — {formData.name || 'Employee'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsEditMode(!isEditMode)} style={{ padding: '0.5rem 1rem', background: isEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  {isEditMode ? '✓ Done Editing' : '✎ Edit Content'}
                </button>
                <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Download PDF
                </button>
                <button onClick={() => setShowPreview(false)} style={{ padding: '0.5rem 0.875rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>

            {isEditMode && (
              <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.55rem 1.5rem', fontSize: '0.76rem', color: '#3b82f6' }}>
                ✎ Edit mode — click any <span style={{ borderBottom: '1px dashed #3b82f6' }}>underlined text</span> to edit. Name, dates, and designation are locked to form values.
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8f9fa' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.8 }}>
                <p style={{ textAlign: 'right', marginBottom: '1.5rem' }}>Date: {formData.currentDate || new Date().toLocaleDateString('en-GB')}</p>

                <h1 style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 700, marginBottom: '2rem', textDecoration: 'underline' }}>
                  {renderStatic('title')}
                </h1>

                <p style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
                  {renderStatic('certifyPrefix')}<strong>{formData.name}</strong>
                  {formData.employeeCode ? ` (Employee ID: ${formData.employeeCode})` : ''}{renderStatic('employedWith')}
                  <strong>DOAGURU INFOSYSTEMS</strong>{renderStatic('asA')}
                  <strong>{formData.designation}</strong>{renderStatic('from')}
                  <strong>{formatDate(formData.joining_date)}</strong>{renderStatic('to')}
                  <strong>{formatDate(formData.resignation_date)}</strong>.
                </p>

                <p style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
                  During {pronouns.possessive}{renderStatic('perfMid1')}{pronouns.subject} {pronouns.be}{renderStatic('perfMid2')}
                  {pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)}{renderStatic('perfSuffix')}
                </p>

                <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
                  {renderStatic('wishPrefix')}<strong>{formData.name}</strong>{renderStatic('wishSuffix')}
                </p>

                <div style={{ marginTop: '3rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}>For DOAGURU INFOSYSTEMS</p>
                  <img src={Signature} alt="Signature" style={{ width: '6rem', marginBottom: '0.25rem' }} />
                  <div style={{ width: '120px', height: '1px', backgroundColor: '#000', marginBottom: '0.25rem' }}></div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {formData.signatory === 'HR Manager' ? 'HR Department' : formData.signatory.includes('CEO') ? 'R.S. Pandey' : formData.signatory}
                  </p>
                  <p style={{ fontSize: '0.85rem' }}>
                    {formData.signatory === 'HR Manager' ? 'HR Manager' : formData.signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeForm;
