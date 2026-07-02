import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment-timezone';
import {
  Document, Page, Text, View, StyleSheet, Image, Link, pdf, Font,
} from '@react-pdf/renderer';

import imgS from '../../assets/images/CEOSignature.png';
import headerImg from '../../assets/images/NewHeaderImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';

Font.registerHyphenationCallback((word) => [String(word)]);

const safe = (v) => (v === null || v === undefined ? '' : String(v));
const safeArray = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x.trim() !== '') : []);
const getPronouns = (gender) => {
  if (gender === 'He') return { subject: 'he', object: 'him', possessive: 'his' };
  if (gender === 'She') return { subject: 'she', object: 'her', possessive: 'her' };
  return { subject: 'they', object: 'them', possessive: 'their' };
};
const getSignatoryDetails = (signatory) => {
  if (signatory === 'HR Manager') return { name: 'HR Department', title: 'HR Manager, DOAGuru Infosystems' };
  if (safe(signatory).includes('CEO')) return { name: 'R.S. Pandey', title: 'CEO, DOAGuru Infosystems' };
  return { name: safe(signatory) || 'Authorized Signatory', title: 'Authorized Signatory' };
};

const pdfStyles = StyleSheet.create({
  page: { paddingTop: 80, paddingBottom: 70, paddingHorizontal: 50, position: 'relative' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  footerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  headerImg: { width: '100%', height: '100%', marginBottom: 8 },
  footerImg: { width: '100%', height: '100%', marginTop: 8 },
  content: { fontSize: 11, lineHeight: 1.4 },
  title: { fontSize: 16, marginBottom: 22, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, marginBottom: 10, fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  signature: { width: 100, height: 50, marginVertical: 15 },
  listItem: { flexDirection: 'row', marginBottom: 6, paddingLeft: 10 },
  bullet: { width: 15, marginRight: 8 },
  strong: { fontWeight: 'bold' },
});

const OfferLetterPDF = ({ data, staticText }) => {
  const d = data;
  const pronouns = getPronouns(d.gender);
  const signatoryDetails = getSignatoryDetails(d.signatory);

  const PageWithHeaderFooter = ({ children }) => (
    <Page size="A4" style={pdfStyles.page}>
      <View fixed style={pdfStyles.headerWrap}><Image src={headerImg} style={pdfStyles.headerImg} /></View>
      <View fixed style={pdfStyles.footerWrap}><Image src={footerImg} style={pdfStyles.footerImg} /></View>
      <View style={pdfStyles.content}>{children}</View>
    </Page>
  );

  return (
    <Document>
      <PageWithHeaderFooter>
        <Text style={pdfStyles.title}>{staticText.heading}</Text>
        <View style={pdfStyles.section}>
          <Text>{staticText.toLabel}</Text>
          <Text style={pdfStyles.bold}>{d.name}</Text>
          <Text style={pdfStyles.bold}>{d.address}</Text>
          <Text style={pdfStyles.bold}>{d.phoneNumber}</Text>
          {d.email ? <Link src={`mailto:${d.email}`} style={pdfStyles.bold}>{d.email}</Link> : <Text style={pdfStyles.bold}> </Text>}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.subject}</Text>
          <Text>{staticText.dear} {d.name},</Text>
          <Text>{staticText.openingLine} {d.position} {staticText.atCompany}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s1Title}</Text>
          <Text>{staticText.s1Line1} <Text style={pdfStyles.strong}>{d.position}</Text>{staticText.s1Line2}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s2Title}</Text>
          <Text>{staticText.s2Line1} <Text style={pdfStyles.strong}>{d.date}</Text>{staticText.s2Line2}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s3Title}</Text>
          <Text>{staticText.s3Line1}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s4Title}</Text>
          <Text>{staticText.s4Line1}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s5Title}</Text>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
            <Text>{staticText.s5Line1} ₹{d.salary} {staticText.s5Line2}</Text>
          </View>
          {staticText.s5Line3?.trim() && (
            <View style={pdfStyles.listItem}>
              <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
              <Text>{staticText.s5Line3}</Text>
            </View>
          )}
          {staticText.s5Line4?.trim() && (
            <View style={pdfStyles.listItem}>
              <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
              <Text>{staticText.s5Line4}</Text>
            </View>
          )}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s6Title}</Text>
          <Text>{staticText.s6Line1} <Text style={pdfStyles.strong}>{d.probationPeriod} months</Text> {staticText.s6Line2}</Text>
          <Text style={pdfStyles.strong}>{staticText.s6Line3}</Text>
          <Text>{staticText.s6Line4}</Text>
          <Text>{staticText.s6Line5} <Text style={pdfStyles.strong}>{d.noticePeriod}</Text> {staticText.s6Line6}</Text>
          <Text>{staticText.s6Line7} <Text style={pdfStyles.strong}>{d.name}</Text> {staticText.s6Line8} {pronouns.possessive} {staticText.s6Line9}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s7Title}</Text>
          {staticText.s7Line1?.trim() && (
            <View style={pdfStyles.listItem}>
              <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
              <Text>{staticText.s7Line1}</Text>
            </View>
          )}
          {staticText.s7Line2?.trim() && (
            <View style={pdfStyles.listItem}>
              <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
              <Text>{staticText.s7Line2}</Text>
            </View>
          )}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s8Title}</Text>
          <Text>{staticText.s8Line1}</Text>
          {d.jobResponsibilities.map((resp, index) => (
            <View key={index} style={pdfStyles.listItem}>
              <Text style={pdfStyles.bullet}>{'\u2022'}</Text>
              <Text>{resp}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.s9Title}</Text>
          {staticText.s9Line1?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line1}</Text></View>}
          {staticText.s9Line2?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line2}</Text></View>}
          {staticText.s9Line3?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line3}</Text></View>}
          {staticText.s9Line4?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line4}</Text></View>}
          {staticText.s9Line5?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line5}</Text></View>}
          {staticText.s9Line6?.trim() && <View style={pdfStyles.listItem}><Text style={pdfStyles.bullet}>{'\u2022'}</Text><Text>{staticText.s9Line6}</Text></View>}
        </View>

        <View style={pdfStyles.section}>
          <Text>{staticText.closing}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.strong}>{staticText.regards}</Text>
          <Image src={imgS} style={pdfStyles.signature} />
          <Text>{signatoryDetails.name}</Text>
          <Text>{signatoryDetails.title}</Text>
        </View>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{staticText.ackHeading}</Text>
          <Text>{staticText.ackLine1} {d.name}, {staticText.ackLine2}</Text>
          <View style={{ marginTop: 30 }}>
            <Text>Signature: ___________________</Text>
            <Text>Date: ________________</Text>
          </View>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const DEFAULT_STATIC = {
  heading: 'OFFER LETTER',
  toLabel: 'To,',
  subject: 'Subject: Offer of Employment',
  dear: 'Dear',
  openingLine: 'We are pleased to offer you the position of',
  atCompany: 'at DOAGuru Infosystems.',
  s1Title: '1. Designation & Department',
  s1Line1: 'You will be designated as',
  s1Line2: ', and you will report to the assigned Team Lead or Manager as per project requirement.',
  s2Title: '2. Joining Date',
  s2Line1: 'Your date of joining shall be',
  s2Line2: ', or as mutually agreed upon.',
  s3Title: '3. Working Days',
  s3Line1: 'You will work 6 days a week, Monday to Saturday, with working hours from 10:00 AM to 7:00 PM as per company policy.',
  s4Title: '4. Place of Work',
  s4Line1: 'Your primary place of work will be at DOAGuru Infosystems, Jabalpur (M.P.), or any other location as assigned.',
  s5Title: '5. Compensation',
  s5Line1: 'Your monthly salary for the first month will be',
  s5Line2: 'Only.',
  s5Line3: 'Based on your performance, salary may be revised as per company policy.',
  s5Line4: 'Your salary will be paid on time every month.',
  s6Title: '6. Probation Period',
  s6Line1: 'You will be on a probation period of',
  s6Line2: 'from the date of joining. During this period, your performance and conduct will be reviewed.',
  s6Line3: 'Probation Period Meaning:',
  s6Line4: 'This is a trial period during which your performance, conduct, learning ability, and behavior will be assessed.',
  s6Line5: 'During this period, either the company or you may terminate the employment with',
  s6Line6: 'notice.',
  s6Line7: 'During probation,',
  s6Line8: 'is expected to demonstrate',
  s6Line9: 'ability to perform assigned duties consistently.',
  s7Title: '7. Notice Period & Service Commitment',
  s7Line1: 'In the event of resignation, you must serve a 30-day written notice. Under no circumstances are you permitted to resign or discontinue your employment within the first six (6) months from your joining date.',
  s7Line2: 'Violation of this clause may lead to appropriate action as per company policy.',
  s8Title: '8. Roles and Responsibilities',
  s8Line1: 'You are expected to:',
  s9Title: '9. General Terms',
  s9Line1: 'You are expected to maintain the highest standards of professionalism, confidentiality, and follow all company policies.',
  s9Line2: 'You are also expected to adhere to the company\'s code of conduct and ethical guidelines.',
  s9Line3: 'The company reserves the right to amend these terms and conditions at any time, with prior notice to the employee.',
  s9Line4: 'This offer is valid for 15 days from the date of issue.',
  s9Line5: 'Failure to accept this offer within the stipulated time will result in the offer being considered withdrawn.',
  s9Line6: 'Any disputes arising from this offer shall be resolved in accordance with the laws of India.',
  closing: 'We look forward to your valuable contribution to DOAGURU INFOSYSTEMS. Please sign and return a copy of this letter as confirmation of your acceptance.',
  regards: 'Warm Regards,',
  ackHeading: 'Acknowledgment:',
  ackLine1: 'I,',
  ackLine2: 'accept the above terms and conditions of employment.',
};

const OfferLater = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFormEditMode = Boolean(id);
  const isPreviewMode = new URLSearchParams(location.search).get('preview') === 'true';

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [offerReleaseDate, setOfferReleaseDate] = useState('');
  const [probationPeriod, setProbationPeriod] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [confirmationNoticePeriod, setConfirmationNoticePeriod] = useState('');
  const [gender, setGender] = useState('');
  const [signatory, setSignatory] = useState('R.S. Pandey (CEO)');
  const [jobResponsibilities, setJobResponsibilities] = useState(['']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContentEditMode, setIsContentEditMode] = useState(false);
  const [staticText, setStaticText] = useState(DEFAULT_STATIC);

  useEffect(() => {
    if (!id) return;
    const fetchOfferLetter = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/offer-letters/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          const d = response.data;
          setName(safe(d.name)); setAddress(safe(d.address)); setPhoneNumber(safe(d.phoneNumber)); setEmail(safe(d.email));
          setDate(safe(d.joiningDate)); setPosition(safe(d.designation)); setSalary(safe(d.salary));
          setOfferReleaseDate(safe(d.offerReleaseDate)); setProbationPeriod(safe(d.probationPeriod));
          setNoticePeriod(safe(d.noticePeriod)); setConfirmationNoticePeriod(safe(d.confirmationNoticePeriod));
          setGender(safe(d.gender)); setSignatory(safe(d.signatory) || 'R.S. Pandey (CEO)');

          let resps = [];
          if (d.jobResponsibilities) {
            resps = Array.isArray(d.jobResponsibilities) ? d.jobResponsibilities : (() => { try { return JSON.parse(d.jobResponsibilities); } catch { return []; } })();
          }
          setJobResponsibilities(safeArray(resps).length > 0 ? safeArray(resps) : ['']);
          if (isPreviewMode) setIsModalOpen(true);
        }
      } catch (error) { console.error('Error fetching offer letter:', error); }
    };
    fetchOfferLetter();
  }, [id, isPreviewMode]);

  const handleSaveInfo = async () => {
    try {
      const letterData = {
        name: safe(name), address: safe(address), phoneNumber: safe(phoneNumber), email: safe(email),
        offerReleaseDate: safe(offerReleaseDate), joiningDate: safe(date), designation: safe(position),
        salary: safe(salary), gender: safe(gender), probationPeriod: safe(probationPeriod),
        noticePeriod: safe(noticePeriod), confirmationNoticePeriod: safe(confirmationNoticePeriod),
        jobResponsibilities: safeArray(jobResponsibilities), signatory: safe(signatory),
      };
      const url = isFormEditMode ? `${process.env.REACT_APP_API_URL}/api/updateOfferLetter/${id}` : `${process.env.REACT_APP_API_URL}/api/saveOfferLetter`;
      const method = isFormEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(letterData) });
      if (response.ok) handlePrint();
    } catch (error) { console.error('Error: ', error); }
  };

  const handleStaticChange = (key, val) => setStaticText(prev => ({ ...prev, [key]: val }));
  const rs = (key) => (
    <span
      contentEditable={isContentEditMode}
      suppressContentEditableWarning
      onBlur={e => handleStaticChange(key, e.currentTarget.textContent)}
      style={{
        outline: isContentEditMode ? '1px dashed #3b82f6' : 'none',
        padding: isContentEditMode ? '1px 3px' : 0,
        borderRadius: '2px',
        backgroundColor: isContentEditMode ? 'rgba(59,130,246,0.06)' : 'transparent',
        display: 'inline',
        cursor: isContentEditMode ? 'text' : 'default',
      }}
    >{staticText[key]}</span>
  );

  const handlePrint = async () => {
    const data = {
      name, address, phoneNumber, email, date, position, salary, gender, offerReleaseDate,
      probationPeriod, noticePeriod, confirmationNoticePeriod, jobResponsibilities, signatory,
    };
    try {
      const instance = pdf(<OfferLetterPDF data={data} staticText={staticText} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safe(name) || 'offer'}_offer_letter.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) { console.error('PDF generation failed:', error); }
  };

  return (
    <div className="dg-page-container">
      <div className="dg-page-header">
        <span className="dg-page-tag">Employee</span>
        <h1 className="dg-page-title">{isPreviewMode ? 'Preview Offer Letter' : isFormEditMode ? 'Edit Offer Letter' : 'Generate Offer Letter'}</h1>
      </div>

      <div className="dg-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{isFormEditMode ? 'Update the details and regenerate PDF' : <span>Fill in the candidate details to generate the <strong>offer letter</strong></span>}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(isFormEditMode || isPreviewMode) && <button onClick={() => navigate('/task/letters/download/offer-letter')} className="dg-btn-secondary">Back to List</button>}
            {!isPreviewMode && <button onClick={handleSaveInfo} className="dg-btn-primary" style={{ width: 'auto' }}>{isFormEditMode ? 'Update Letter' : 'Save & Download PDF'}</button>}
          </div>
        </div>

        <div className="dg-form-section">
          <p className="dg-form-section-title">Candidate Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group"><label className="dg-label">Candidate Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group"><label className="dg-label">Contact Number</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group"><label className="dg-label">Email ID</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group">
              <label className="dg-label">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="dg-select" required disabled={isPreviewMode}>
                <option value="">Select Gender</option><option value="He">Male (He/Him)</option><option value="She">Female (She/Her)</option><option value="They">Other (They/Them)</option>
              </select>
            </div>
            <div className="dg-form-group col-span-1 md:col-span-2 lg:col-span-4" style={{ marginTop: '0.25rem' }}>
              <label className="dg-label">Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="dg-textarea" rows="2" required disabled={isPreviewMode} style={{ minHeight: '44px', height: '44px' }} />
            </div>
          </div>
        </div>

        <div className="dg-form-section">
          <p className="dg-form-section-title">Job Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group"><label className="dg-label">Position / Designation</label><input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group"><label className="dg-label">Monthly Salary (Rs.)</label><input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group"><label className="dg-label">Joining Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group"><label className="dg-label">Offer Release Date</label><input type="date" value={offerReleaseDate} onChange={(e) => setOfferReleaseDate(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
          </div>
        </div>

        <div className="dg-form-section">
          <p className="dg-form-section-title">Terms and Conditions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group">
              <label className="dg-label">Probation Period</label>
              <select value={probationPeriod} onChange={(e) => setProbationPeriod(e.target.value)} className="dg-select" required disabled={isPreviewMode}>
                <option value="">Select</option>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m} month{m>1?'s':''}</option>)}
              </select>
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Notice Period During Probation</label>
              <select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className="dg-select" required disabled={isPreviewMode}>
                <option value="">Select</option><option value="7 days">7 days</option><option value="15 days">15 days</option>
              </select>
            </div>
            <div className="dg-form-group"><label className="dg-label">Notice After Confirmation</label><input type="text" value={confirmationNoticePeriod} onChange={(e) => setConfirmationNoticePeriod(e.target.value)} className="dg-input" required disabled={isPreviewMode} /></div>
            <div className="dg-form-group">
              <label className="dg-label">Signatory</label>
              <select value={signatory} onChange={(e) => setSignatory(e.target.value)} className="dg-select" required disabled={isPreviewMode}>
                <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option><option value="HR Manager">HR Manager</option>
              </select>
            </div>
          </div>
        </div>

        <div className="dg-form-section">
          <p className="dg-form-section-title">Job Responsibilities</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {jobResponsibilities.map((resp, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.875rem' }}>{i + 1}.</span>
                <input type="text" value={resp} onChange={(e) => {const r = [...jobResponsibilities]; r[i] = e.target.value; setJobResponsibilities(r);}} className="dg-input" style={{ flex: 1 }} required disabled={isPreviewMode} />
                {!isPreviewMode && <button type="button" onClick={() => setJobResponsibilities(jobResponsibilities.filter((_, idx) => idx !== i).length ? jobResponsibilities.filter((_, idx) => idx !== i) : [''])} style={{ padding: '0.5rem 0.75rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>}
              </div>
            ))}
          </div>
          {!isPreviewMode && <button type="button" onClick={() => setJobResponsibilities([...jobResponsibilities, ''])} style={{ marginTop: '0.875rem', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>+ Add Responsibility</button>}
        </div>

        <div className="dg-form-actions">
          {!isPreviewMode && <button onClick={handleSaveInfo} className="dg-btn-primary" style={{ width: 'auto' }}>{isFormEditMode ? 'Update Letter' : 'Save and Download PDF'}</button>}
          <button type="button" onClick={() => setIsModalOpen(true)} className="dg-btn-secondary">Preview Letter</button>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', width: '95vw', maxWidth: '900px', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Offer Letter Preview — {name || 'Candidate'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsContentEditMode(!isContentEditMode)} style={{ padding: '0.5rem 1rem', background: isContentEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  {isContentEditMode ? '✓ Done Editing' : '✎ Edit Content'}
                </button>
                <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Download PDF
                </button>
                <button onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 0.875rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>

            {isContentEditMode && (
              <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.55rem 1.5rem', fontSize: '0.76rem', color: '#3b82f6' }}>
                ✎ Edit mode — click any <span style={{ borderBottom: '1px dashed #3b82f6' }}>underlined text</span> to edit. Name, dates, and salary are locked to form values.
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8f9fa' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', color: '#1a1a1a', fontSize: '0.9rem', lineHeight: 1.7 }}>
                <h1 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{rs('heading')}</h1>
                <div style={{ borderBottom: '2px solid #6366f1', marginBottom: '1rem', paddingBottom: '0.75rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>DOAGuru Infosystems</p>
                  <p style={{ fontSize: '0.8rem', color: '#555' }}>www.doaguru.com | info@doaguru.com | +91-7440992424</p>
                </div>
                <p style={{ marginBottom: '1rem' }}><strong>Date:</strong> {offerReleaseDate ? moment.tz(offerReleaseDate, 'Asia/Kolkata').format('DD MMMM YYYY') : moment().tz('Asia/Kolkata').format('DD MMMM YYYY')}</p>
                <p><strong>{rs('toLabel')}</strong><br />{name}<br />{address}<br />{phoneNumber}<br />{email}</p>
                <p style={{ marginTop: '1rem', fontWeight: 700 }}>{rs('subject')}</p>
                <p style={{ marginTop: '0.5rem' }}>{rs('dear')} {name},</p>
                <p>{rs('openingLine')} <strong>{position}</strong> {rs('atCompany')}</p>
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s1Title')}</p><p>{rs('s1Line1')} {position}{rs('s1Line2')}</p></div>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s2Title')}</p><p>{rs('s2Line1')} <strong>{date ? moment.tz(date, 'Asia/Kolkata').format('DD MMMM YYYY') : ''}</strong>{rs('s2Line2')}</p></div>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s3Title')}</p><p>{rs('s3Line1')}</p></div>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s4Title')}</p><p>{rs('s4Line1')}</p></div>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s5Title')}</p><p>• {rs('s5Line1')} ₹{salary} {rs('s5Line2')}</p>{(isContentEditMode || staticText.s5Line3?.trim()) && <p>• {rs('s5Line3')}</p>}{(isContentEditMode || staticText.s5Line4?.trim()) && <p>• {rs('s5Line4')}</p>}</div>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700 }}>{rs('s6Title')}</p><p>{rs('s6Line1')} {probationPeriod} months {rs('s6Line2')}</p>
                    <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>{rs('s6Line3')}</p><p>{rs('s6Line4')}</p>
                    <p>{rs('s6Line5')} {noticePeriod} {rs('s6Line6')}</p>
                    <p>{rs('s6Line7')} <strong>{name || 'the candidate'}</strong> {rs('s6Line8')} {getPronouns(gender).possessive} {rs('s6Line9')}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}><p style={{ fontWeight: 700 }}>{rs('s7Title')}</p>{(isContentEditMode || staticText.s7Line1?.trim()) && <p>• {rs('s7Line1')}</p>}{(isContentEditMode || staticText.s7Line2?.trim()) && <p>• {rs('s7Line2')}</p>}</div>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700 }}>{rs('s8Title')}</p><p>{rs('s8Line1')}</p>
                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>{jobResponsibilities.filter(r => r.trim() !== '').map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700 }}>{rs('s9Title')}</p>
                    {(isContentEditMode || staticText.s9Line1?.trim()) && <p>• {rs('s9Line1')}</p>}
                    {(isContentEditMode || staticText.s9Line2?.trim()) && <p>• {rs('s9Line2')}</p>}
                    {(isContentEditMode || staticText.s9Line3?.trim()) && <p>• {rs('s9Line3')}</p>}
                    {(isContentEditMode || staticText.s9Line4?.trim()) && <p>• {rs('s9Line4')}</p>}
                    {(isContentEditMode || staticText.s9Line5?.trim()) && <p>• {rs('s9Line5')}</p>}
                    {(isContentEditMode || staticText.s9Line6?.trim()) && <p>• {rs('s9Line6')}</p>}
                  </div>
                </div>
                <p style={{ marginTop: '1.5rem' }}>{rs('closing')}</p>
                <div style={{ marginTop: '2rem' }}>
                  <p style={{ fontWeight: 700 }}>{rs('regards')}</p>
                  <img src={imgS} alt="Signature" style={{ width: '6rem', marginTop: '0.5rem' }} />
                  <p style={{ marginTop: '0.5rem' }}>{getSignatoryDetails(signatory).name}</p>
                  <p>{getSignatoryDetails(signatory).title}</p>
                </div>
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                  <p style={{ fontWeight: 700 }}>{rs('ackHeading')}</p>
                  <p>{rs('ackLine1')} <strong>{name}</strong>, {rs('ackLine2')}</p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '3rem' }}>
                    <p>Signature: ___________________</p>
                    <p>Date: ________________</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLater;
