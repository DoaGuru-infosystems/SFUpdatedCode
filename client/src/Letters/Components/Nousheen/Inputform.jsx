import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link, pdf } from '@react-pdf/renderer';
import imgS from '../../assets/images/CEOSignature.png';
import logo from '../../assets/images/CLogo.png';
import headerImg from '../../assets/images/NewHeaderImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';
import { useNavigate } from 'react-router-dom';

const pdfStyles = StyleSheet.create({
  page: { paddingTop: 80, paddingBottom: 70, paddingHorizontal: 50, position: 'relative', fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5, color: '#333' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  footerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  headerImg: { width: '100%', height: '100%' },
  footerImg: { width: '100%', height: '100%' },
  content: { marginTop: 15 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000', textDecoration: 'underline' },
  logoHeader: { width: 60, marginBottom: 10 },
  companyAddress: { marginBottom: 15 },
  dateRight: { textAlign: 'right', marginBottom: 15 },
  paragraph: { marginBottom: 10, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  signatureSection: { marginTop: 30 },
  signatureImage: { width: 100, height: 50, marginBottom: 5 },
  signatureText: { fontSize: 11, fontWeight: 'bold' },
  signatureTitle: { fontSize: 10 },
});

const WarningLetterPDF = ({ data, staticText }) => {
  const { name, formattedDate, warningDetails } = data;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View fixed style={pdfStyles.headerWrap}><Image src={headerImg} style={pdfStyles.headerImg} /></View>
        <View fixed style={pdfStyles.footerWrap}><Image src={footerImg} style={pdfStyles.footerImg} /></View>
        
        <View style={pdfStyles.content}>
          <Text style={pdfStyles.title}>{staticText.heading}</Text>
          <Image src={logo} style={pdfStyles.logoHeader} />
          
          <View style={pdfStyles.companyAddress}>
            <Text>1815, Wright Town, Jabalpur</Text>
            <Text>Madhya Pradesh, 482002</Text>
            <Link src="http://www.doaguru.com" style={{ color: '#1e3a8a', textDecoration: 'none' }}>www.doaguru.com</Link>
          </View>

          <View style={pdfStyles.dateRight}>
            <Text style={pdfStyles.bold}>Warning Release Date: {formattedDate}</Text>
          </View>

          <Text style={pdfStyles.paragraph}>{staticText.dear} {name},</Text>
          <Text style={pdfStyles.paragraph}>{warningDetails}</Text>
          
          <Text style={pdfStyles.paragraph}>{staticText.p1}</Text>
          <Text style={pdfStyles.paragraph}>{staticText.p2}</Text>

          <View style={pdfStyles.signatureSection}>
            <Image src={imgS} style={pdfStyles.signatureImage} />
            <Text style={pdfStyles.signatureText}>R.S.Pandey</Text>
            <Text style={pdfStyles.signatureTitle}>(CEO) DOAGuru InfoSystems.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const DEFAULT_STATIC = {
  heading: 'WARNING LETTER',
  dear: 'Dear',
  p1: 'We hope that this letter will act as a warning to avoid complications in the future. If you have any say in this regard you may feel free to contact any person in management and report your grievances.',
  p2: 'We expect you to have good behavior and observe good conduct here after.'
};

const WarningLetter = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [warningDetails, setWarningDetails] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [staticText, setStaticText] = useState(DEFAULT_STATIC);
  
  const navigate = useNavigate();

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '[Date]';

  const handlePrint = async () => {
    try {
      const data = { name: name || '[Name]', formattedDate, warningDetails: warningDetails || '[Warning Details]' };
      const instance = pdf(<WarningLetterPDF data={data} staticText={staticText} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warning_letter_${name || 'employee'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Error generating PDF');
    }
  };

  const renderStatic = (key) => (
    <span
      contentEditable={isEditMode}
      suppressContentEditableWarning
      onBlur={(e) => setStaticText((prev) => ({ ...prev, [key]: e.currentTarget.textContent }))}
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

  return (
    <div className="dg-page-container">
      <div className="dg-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="dg-page-tag">Warning</span>
          <h1 className="dg-page-title">Generate Warning Letter</h1>
        </div>
        <button onClick={() => navigate('/LetterGenrate')} className="dg-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          View all PDFs
        </button>
      </div>

      <div className="dg-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Fill in the details to generate the <strong>warning letter</strong>
          </p>
        </div>

        <form>
          <div className="dg-form-section">
            <p className="dg-form-section-title">Warning Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group">
                <label className="dg-label">Candidate Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="dg-input" required />
              </div>

              <div className="dg-form-group">
                <label className="dg-label">Warning Release Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="dg-input" required />
              </div>
            </div>

            <div className="dg-form-group" style={{ marginTop: '1rem' }}>
              <label className="dg-label">Warning Reason / Details</label>
              <textarea value={warningDetails} onChange={(e) => setWarningDetails(e.target.value)} className="dg-textarea" rows="4" required></textarea>
            </div>
          </div>

          <div className="dg-form-actions">
            <button type="button" onClick={() => setIsModalOpen(true)} className="dg-btn-secondary">
              Preview Warning Letter
            </button>
          </div>
        </form>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', width: '95vw', maxWidth: '900px', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.3s ease' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Warning Letter Preview — {name || 'Employee'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsEditMode(!isEditMode)} style={{ padding: '0.5rem 1rem', background: isEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  {isEditMode ? '✓ Done Editing' : '✎ Edit Content'}
                </button>
                <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Download PDF
                </button>
                <button onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 0.875rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>

            {isEditMode && (
              <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.55rem 1.5rem', fontSize: '0.76rem', color: '#3b82f6' }}>
                ✎ Edit mode — click any <span style={{ borderBottom: '1px dashed #3b82f6' }}>underlined text</span> to edit. Name and dates are locked to form values.
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8f9fa' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.6 }}>
                
                <h1 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textDecoration: 'underline' }}>
                  {renderStatic('heading')}
                </h1>
                
                <img src={logo} alt="Logo" style={{ width: '5rem', marginBottom: '1rem' }} />
                
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <p>1815, Wright Town, Jabalpur</p>
                  <p>Madhya Pradesh, 482002</p>
                  <p><a href="http://www.doaguru.com" target="_blank" rel="noreferrer" style={{ color: '#1e3a8a', textDecoration: 'none' }}>www.doaguru.com</a></p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 700 }}>Warning Release Date: {formattedDate}</p>
                </div>

                <p style={{ marginBottom: '1rem' }}>{renderStatic('dear')} {name || '[Name]'},</p>
                
                <p style={{ marginBottom: '1rem' }}>
                  <span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => setWarningDetails(e.currentTarget.textContent)}
                    style={{
                      outline: isEditMode ? '1px dashed #3b82f6' : 'none',
                      padding: isEditMode ? '1px 3px' : 0,
                      borderRadius: '2px',
                      backgroundColor: isEditMode ? 'rgba(59,130,246,0.06)' : 'transparent',
                      display: 'inline-block',
                      cursor: isEditMode ? 'text' : 'default',
                      minWidth: '100%',
                      minHeight: '1.5em'
                    }}
                  >
                    {warningDetails || '[Warning Details]'}
                  </span>
                </p>

                <p style={{ marginBottom: '1rem' }}>{renderStatic('p1')}</p>
                <p style={{ marginBottom: '2.5rem' }}>{renderStatic('p2')}</p>

                <div style={{ marginTop: '3rem' }}>
                  <img src={imgS} alt="Signature" style={{ width: '7rem', marginBottom: '0.25rem' }} />
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>R.S.Pandey</p>
                  <p style={{ fontSize: '0.85rem' }}>(CEO) DOAGuru InfoSystems.</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarningLetter;
