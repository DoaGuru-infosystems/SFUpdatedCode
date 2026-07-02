import { useState, useRef } from 'react';
import axios from 'axios';
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

// Assets (ensure these resolve to public URLs at runtime)
import imgS from '../../assets/images/CEOSignature.png';
import headerImg from '../../assets/images/NewHeaderImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';

// ---- IMPORTANT: prevent hyphenation issues on e-mails/long tokens ----
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

// PDF Styles — use numeric values (points) instead of CSS strings
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
  strong: {
    fontWeight: 'bold',
  },
});

// PDF Component
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
    <Page size="A4" style={ styles.page }>
      {/* Use fixed containers so header/footer never interfere with layout */ }
      <View fixed style={ styles.headerWrap }>
        <Image src={ headerImg } style={ styles.headerImg } />
      </View>
      <View fixed style={ styles.footerWrap }>
        <Image src={ footerImg } style={ styles.footerImg } />
      </View>
      <View style={ styles.content }>{ children }</View>
    </Page>
  );

  return (
    <Document>
      {/* Page 1 - Internship Offer Details */ }
      <PageWithHeaderFooter>
        <Text style={ styles.title }>INTERNSHIP OFFER LETTER</Text>

        { d.offerReleaseDate ? (
          <Text style={ { fontSize: 11, marginBottom: 10 } }>
            <Text style={ styles.bold }>Date: </Text>{ d.offerReleaseDate }
          </Text>
        ) : null }

        <View style={ styles.section }>
          <Text>To,</Text>
          <Text style={ styles.bold }>{ d.name }</Text>
          <Text style={ styles.bold }>{ d.address }</Text>
          <Text style={ styles.bold }>{ d.phoneNumber }</Text>
          {/* Render email safely and make it a mailto Link (no wrapping issues) */ }
          { d.email ? (
            <Link src={ `mailto:${d.email}` } style={ styles.bold }>
              { d.email }
            </Link>
          ) : (
            <Text style={ styles.bold }> </Text>
          ) }
        </View>

        <View style={ styles.section }>
          <Text style={ styles.sectionTitle }>{ staticText.subject }</Text>
          <Text>{ staticText.greeting }{ d.name },</Text>
          <Text>
            { staticText.intro }<Text style={ styles.strong }>{ d.position }</Text>
          </Text>
        </View>

        { visibleSections.duration && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.durationTitle }</Text>
            <Text>
              { staticText.durationText1 }<Text style={ styles.strong }>{ d.startDate }</Text>{ staticText.durationText2 }<Text style={ styles.strong }>{ d.endDate }</Text>.
            </Text>
          </View>
        ) }

        { visibleSections.pos && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.posTitle }</Text>
            <Text>
              { staticText.posText1 }<Text style={ styles.strong }>{ d.position }</Text>{ staticText.posText2 }
            </Text>
            { visibleSections.perf && (
              <>
                <Text style={ [styles.sectionTitle, { marginTop: 10, fontSize: 12 }] }>{ getSubNum() }{ staticText.perfTitle }</Text>
                <Text>
                  { staticText.perfText1 }<Text style={ styles.strong }>{ d.name }</Text>{ staticText.perfText2 }{ pronouns.possessive }{ staticText.perfText3 }
                </Text>
              </>
            ) }
          </View>
        ) }

        { visibleSections.stipend && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.stipendTitle }</Text>
            <Text>
              { staticText.stipendText1 }<Text style={ styles.strong }>{ d.stipend }</Text>.
            </Text>
          </View>
        ) }

        { visibleSections.mentor && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.mentorTitle }</Text>
            <Text>
              { staticText.mentorText1 }<Text style={ styles.strong }>{ d.mentorName }</Text> ({ d.mentorContact }).
            </Text>
          </View>
        ) }

        { visibleSections.work && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.workTitle }</Text>
            <Text>{ staticText.workText1 }</Text>
          </View>
        ) }

        { visibleSections.place && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.placeTitle }</Text>
            <Text>{ staticText.placeText1 }</Text>
          </View>
        ) }

        { visibleSections.terms && (
          <View style={ styles.section }>
            <Text style={ styles.sectionTitle }>{ getNum() }{ staticText.termsTitle }</Text>
            { d.termsAndConditions.map((term, index) => (
              <View key={ index } style={ styles.listItem }>
                <Text style={ styles.bullet }>{ index + 1 }.</Text>
                <Text>{ term }</Text>
              </View>
            )) }
          </View>
        ) }

        <View style={ styles.section }>
          <Text>{ staticText.outro }</Text>
        </View>

        <View style={ styles.section }>
          <Text style={ styles.strong }>Warm Regards,</Text>
          <Image src={ imgS } style={ styles.signature } />
          <Text>{ signatoryDetails.name }</Text>
          <Text>{ signatoryDetails.title }</Text>
        </View>

        <View style={ styles.section }>
          <Text style={ styles.sectionTitle }>Acknowledgment:</Text>
          <Text>I, { d.name }, accept the above terms and conditions of internship.</Text>
          <View style={ { marginTop: 30 } }>
            <Text>Signature: ___________________</Text>
            <Text>Date: ________________</Text>
          </View>
        </View>
      </PageWithHeaderFooter>
    </Document>
  );
};

const InternshipOfferLetter = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    startDate: '',
    endDate: '',
    position: 'Intern',
    stipend: '',
    mentorName: '',
    mentorContact: '',
    gender: '',
    signatory: 'R.S. Pandey (CEO)',
    offerReleaseDate: '',
    termsAndConditions: [
      'The internship duration is as mentioned above.',
      'You will be required to maintain a minimum attendance of 80%.',
      'You will be assigned a mentor for guidance.',
      'Company policies must be strictly followed.',
      'Confidentiality of company information must be maintained.'
    ]
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [staticText, setStaticText] = useState({
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
    regards: 'Warm Regards,',
    ackTitle: 'Acknowledgment',
    ackText: 'I, ',
    ackText2: ', accept the above terms and conditions of internship.'
  });

  const [visibleSections, setVisibleSections] = useState({
    duration: true,
    pos: true,
    perf: true,
    stipend: true,
    mentor: true,
    work: true,
    place: true,
    terms: true
  });

  const toggleSection = (key) => {
    setVisibleSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const previewRef = useRef();

  const handleStaticChange = (key, value) => {
    setStaticText(prev => ({ ...prev, [key]: value }));
  };

  const renderStatic = (key, isBlock = false) => (
    <span
      contentEditable={ isEditMode }
      suppressContentEditableWarning
      onBlur={ (e) => handleStaticChange(key, e.currentTarget.textContent) }
      style={ {
        outline: isEditMode ? '1px dashed #3b82f6' : 'none',
        padding: isEditMode ? '2px' : 0,
        borderRadius: '2px',
        backgroundColor: isEditMode ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        display: isBlock ? 'block' : 'inline',
        minWidth: isEditMode ? '20px' : 'auto'
      } }
    >
      { staticText[key] }
    </span>
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTermChange = (index, value) => {
    const updatedTerms = [...formData.termsAndConditions];
    updatedTerms[index] = value;
    setFormData(prev => ({
      ...prev,
      termsAndConditions: updatedTerms
    }));
  };

  const addTerm = () => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, '']
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleSaveInfo = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/saveInternshipOffer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Internship offer saved successfully');
        handlePrint();
      } else {
        console.log('Failed to save internship offer');
      }
    } catch (error) {
      console.log('Error: ', error);
    }
  };

  const handlePrint = async () => {
    const formatDate = (dateStr) =>
      dateStr ? moment.tz(dateStr, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY') : '';

    const data = {
      name: formData.name,
      address: formData.address,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      startDate: formatDate(formData.startDate),
      endDate: formatDate(formData.endDate),
      position: formData.position,
      stipend: formData.stipend,
      mentorName: formData.mentorName,
      mentorContact: formData.mentorContact,
      gender: formData.gender,
      signatory: formData.signatory,
      offerReleaseDate: formatDate(formData.offerReleaseDate),
      termsAndConditions: formData.termsAndConditions,
    };

    try {
      // Build the PDF instance explicitly to avoid any race conditions
      const instance = pdf();
      instance.updateContainer(<InternshipOfferLetterPDF data={ data } staticText={ staticText } visibleSections={ visibleSections } />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safe(formData.name) || 'internship'}_internship_offer_letter.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  let domSectionCounter = 1;
  const getDomNum = () => `${domSectionCounter++}. `;
  const getDomSubNum = () => `${domSectionCounter - 1}.1 `;

  const renderSectionWrapper = (key, content) => {
    if (!visibleSections[key] && !isEditMode) return null;
    return (
      <div style={ { marginBottom: '1rem', position: 'relative', opacity: visibleSections[key] ? 1 : 0.4, transition: 'opacity 0.2s' } }>
        { isEditMode && (
          <button
            onClick={ () => toggleSection(key) }
            style={ { position: 'absolute', right: 0, top: 0, padding: '2px 8px', fontSize: '10px', background: visibleSections[key] ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: visibleSections[key] ? '#ef4444' : '#10b981', border: `1px solid ${visibleSections[key] ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, borderRadius: '4px', cursor: 'pointer', zIndex: 10 } }
          >
            { visibleSections[key] ? '× Remove' : '+ Restore' }
          </button>
        ) }
        <div style={ { pointerEvents: visibleSections[key] ? 'auto' : 'none' } }>
          { content() }
        </div>
      </div>
    );
  };

  return (
    <div className="dg-page-container">
      {/* Page Header */ }
      <div className="dg-page-header">
        <span className="dg-page-tag">Internship</span>
        <h1 className="dg-page-title">Generate Internship Offer Letter</h1>
      </div>

      <div className="dg-form-card">
        {/* Top action bar */ }
        <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' } }>
          <p style={ { fontSize: '0.875rem', color: 'var(--text-secondary)' } }>
            Fill in the intern details to generate the <strong>offer letter</strong>
          </p>
        </div>

        {/* Section: Intern Info */ }
        <div className="dg-form-section">
          <p className="dg-form-section-title">Candidate Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group">
              <label className="dg-label">Candidate Name</label>
              <input type="text" name="name" value={ formData.name } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Contact Number</label>
              <input type="text" name="phoneNumber" value={ formData.phoneNumber } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Email</label>
              <input type="email" name="email" value={ formData.email } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Gender</label>
              <select name="gender" value={ formData.gender } onChange={ handleChange } className="dg-select" required>
                <option value="">Select Gender</option>
                <option value="He">Male (He/Him)</option>
                <option value="She">Female (She/Her)</option>
                <option value="They">Other (They/Them)</option>
              </select>
            </div>
            <div className="dg-form-group col-span-1 md:col-span-2 lg:col-span-4" style={ { marginTop: '0.25rem' } }>
              <label className="dg-label">Address</label>
              <textarea name="address" value={ formData.address } onChange={ handleChange } className="dg-textarea" rows="2" style={ { minHeight: '44px', height: '44px' } } required></textarea>
            </div>
          </div>
        </div>

        {/* Section: Internship Details */ }
        <div className="dg-form-section">
          <p className="dg-form-section-title">Internship Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group">
              <label className="dg-label">Position</label>
              <input type="text" name="position" value={ formData.position } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Monthly Stipend</label>
              <input type="text" name="stipend" value={ formData.stipend } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } placeholder="e.g., Rs. 5000" required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Start Date</label>
              <input type="date" name="startDate" value={ formData.startDate } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">End Date</label>
              <input type="date" name="endDate" value={ formData.endDate } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
          </div>
        </div>

        {/* Section: Mentor & Misc */ }
        <div className="dg-form-section">
          <p className="dg-form-section-title">Mentor & Issuance</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            <div className="dg-form-group">
              <label className="dg-label">Mentor's Name</label>
              <input type="text" name="mentorName" value={ formData.mentorName } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group">
              <label className="dg-label">Offer Release Date</label>
              <input type="date" name="offerReleaseDate" value={ formData.offerReleaseDate } onChange={ handleChange } className="dg-input" style={ { paddingLeft: '1rem' } } required />
            </div>
            <div className="dg-form-group col-span-1 md:col-span-2 lg:col-span-4">
              <label className="dg-label">Signatory</label>
              <select name="signatory" value={ formData.signatory } onChange={ handleChange } className="dg-select" required>
                <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                <option value="HR Manager">HR Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Terms and Conditions */ }
        <div className="dg-form-section">
          <p className="dg-form-section-title">Terms & Conditions</p>
          <div style={ { display: 'flex', flexDirection: 'column', gap: '0.625rem' } }>
            { formData.termsAndConditions.map((term, index) => (
              <div key={ index } style={ { display: 'flex', gap: '0.5rem', alignItems: 'center' } }>
                <span style={ { color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.875rem', minWidth: '1.5rem', textAlign: 'center' } }>
                  { index + 1 }.
                </span>
                <input
                  type="text"
                  value={ term }
                  onChange={ (e) => handleTermChange(index, e.target.value) }
                  className="dg-input"
                  style={ { paddingLeft: '1rem', flex: 1 } }
                  required
                />
              </div>
            )) }
          </div>
          <button
            type="button"
            onClick={ addTerm }
            style={ { marginTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' } }
            onMouseEnter={ (e) => e.currentTarget.style.background = 'rgba(16,185,129,0.18)' }
            onMouseLeave={ (e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }
          >
            + Add Term
          </button>
        </div>

        {/* Action Buttons */ }
        <div className="dg-form-actions">
          <button type="button" onClick={ handleSubmit } className="dg-btn-secondary">
            Preview Letter
          </button>
        </div>
      </div>

      {/* Preview Modal */ }
      { isModalOpen && (
        <div style={ { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' } }>
          <div style={ { background: '#1a1a2e', border: '1px solid var(--border-medium)', borderRadius: '16px', width: '95vw', maxWidth: '900px', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.3s ease' } }>
            {/* Modal Header */ }
            <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' } }>
              <h3 style={ { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' } }>Internship Offer Preview — { formData.name || 'Candidate' }</h3>
              <div style={ { display: 'flex', gap: '0.5rem' } }>
                <button onClick={ () => setIsEditMode(!isEditMode) } style={ { padding: '0.5rem 1rem', background: isEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 } }>
                  { isEditMode ? 'Save Content' : 'Edit Content' }
                </button>
                <button onClick={ handlePrint } style={ { padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 } }>
                  Download PDF
                </button>
                <button onClick={ handleSaveInfo } style={ { padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 } }>
                  Save & Print
                </button>
                <button onClick={ closeModal } style={ { padding: '0.5rem 0.875rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 } }>
                  Close
                </button>
              </div>
            </div>

            {/* Modal Body: Printed White Theme for PDF */ }
            <div ref={ previewRef } style={ { flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8f9fa' } }>
              <div style={ { maxWidth: '720px', margin: '0 auto', background: 'white', borderRadius: '8px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', color: '#1a1a1a', fontSize: '0.9rem', lineHeight: 1.7 } }>
                <h1 style={ { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' } }>INTERNSHIP OFFER LETTER</h1>
                <div style={ { borderBottom: '2px solid #6366f1', marginBottom: '1rem', paddingBottom: '0.75rem' } }>
                  <p style={ { fontWeight: 700, fontSize: '1rem' } }>DOAGuru Infosystems</p>
                  <p style={ { fontSize: '0.8rem', color: '#555' } }>www.doaguru.com | info@doaguru.com | +91-7440992424</p>
                </div>
                <p style={ { marginBottom: '1rem' } }><strong>Date:</strong> { formData.offerReleaseDate ? moment.tz(formData.offerReleaseDate, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY') : moment().tz('Asia/Kolkata').format('DD MMMM YYYY') }</p>
                
                <p><strong>To,</strong><br />{ formData.name }<br />{ formData.address }<br />{ formData.phoneNumber }<br />{ formData.email }</p>
                <p style={ { marginTop: '1rem' } }><strong>{ renderStatic('subject') }</strong></p>
                <p style={ { marginTop: '0.5rem' } }>{ renderStatic('greeting') }{ formData.name },</p>
                <p>{ renderStatic('intro') }<strong>{ formData.position }</strong></p>

                <div style={ { marginTop: '1.5rem' } }>
                  { renderSectionWrapper('duration', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('durationTitle') }</p>
                      <p>{ renderStatic('durationText1') }<strong>{ formData.startDate ? moment.tz(formData.startDate, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY') : '' }</strong>{ renderStatic('durationText2') }<strong>{ formData.endDate ? moment.tz(formData.endDate, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY') : '' }</strong>.</p>
                    </>
                  )) }

                  { renderSectionWrapper('pos', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('posTitle') }</p>
                      <p>{ renderStatic('posText1') }<strong>{ formData.position }</strong>{ renderStatic('posText2') }</p>
                      { visibleSections.perf && (
                        <div style={ { marginTop: '1rem' } }>
                          <p style={ { fontWeight: 700 } }>{getDomNum() }{ renderStatic('perfTitle') }</p>
                          <p>{ renderStatic('perfText1') }<strong>{ formData.name || 'the intern' }</strong>{ renderStatic('perfText2') }{ getPronouns(formData.gender).possessive }{ renderStatic('perfText3') }</p>
                        </div>
                      ) }
                    </>
                  )) }

                  { renderSectionWrapper('stipend', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('stipendTitle') }</p>
                      <p>{ renderStatic('stipendText1') }<strong>{ formData.stipend }</strong>.</p>
                    </>
                  )) }

                  { renderSectionWrapper('mentor', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('mentorTitle') }</p>
                      <p>{ renderStatic('mentorText1') }<strong>{ formData.mentorName }</strong> </p>
                    </>
                  )) }

                  { renderSectionWrapper('work', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('workTitle') }</p>
                      <p>{ renderStatic('workText1') }</p>
                    </>
                  )) }

                  { renderSectionWrapper('place', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('placeTitle') }</p>
                      <p>{ renderStatic('placeText1') }</p>
                    </>
                  )) }

                  { renderSectionWrapper('terms', () => (
                    <>
                      <p style={ { fontWeight: 700 } }>{ getDomNum() }{ renderStatic('termsTitle') }</p>
                      <ul style={ { paddingLeft: '1.25rem', marginTop: '0.5rem' } }>
                        { formData.termsAndConditions.filter(t => t.trim() !== '').map((term, index) => <li key={ index }>{ term }</li>) }
                      </ul>
                    </>
                  )) }
                </div>

                <p style={ { marginTop: '1.5rem' } }>{ renderStatic('outro') }</p>
                <div style={ { marginTop: '2rem' } }>
                  <p style={ { fontWeight: 700 } }>{ renderStatic('regards') }</p>
                  <p style={ { marginTop: '0.5rem' } }>{ getSignatoryDetails(formData.signatory).name }</p>
                  <p>{ getSignatoryDetails(formData.signatory).title }</p>
                </div>
                <div style={ { marginTop: '2.5rem', borderTop: '1px solid #ddd', paddingTop: '1rem' } }>
                  <p style={ { fontWeight: 700 } }>{ renderStatic('ackTitle') }</p>
                  <p>{ renderStatic('ackText') }<strong>{ formData.name }</strong>{ renderStatic('ackText2') }</p>
                  <div style={ { marginTop: '1.5rem', display: 'flex', gap: '3rem' } }>
                    <p>Signature: ___________________</p>
                    <p>Date: ________________</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
};

export default InternshipOfferLetter;



