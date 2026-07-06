import { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowBack } from "react-icons/io";
import axios from 'axios';
import moment from 'moment-timezone';
import CLogo from '../../assets/images/CLogo.png';
import headerImg from '../../assets/images/NewHeaderImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';
import imgS from '../../assets/images/CEOSignature.png';
import SearchableSelect from '../../Components/SearchableSelect';

Modal.setAppElement('#root');

const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    maxWidth: '820px', width: '95%', maxHeight: '92vh', overflowY: 'auto',
    padding: '0', border: 'none', borderRadius: '12px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
  },
  overlay: { backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000 }
};

const TerminationLetter = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [gender, setGender] = useState('');
  const [signatory, setSignatory] = useState('R.S. Pandey (CEO)');
  const [reason, setReason] = useState('Poor Performance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef();
  const navigate = useNavigate();

  const [staticText, setStaticText] = useState({
    subject: 'Subject: Termination of Employment',
    greeting: 'Dear',
    regretLine: 'We regret to inform you that your employment with DOAGuru Infosystems as a',
    inDept: 'in the',
    deptSuffix: 'Department is hereby terminated with effect from',
    considerationLine: 'This decision has been taken after careful consideration and following the terms and conditions of your employment contract.',
    reasonPoorPerf: 'Despite prior discussions, reviews, and feedback, the expectations and standards of the organisation have not been met satisfactorily.',
    reasonMisconduct: 'This decision has been taken due to a severe breach of the company\'s code of conduct and professional standards.',
    reasonDownsizing: 'Due to recent restructuring and downsizing within the organisation, we regret to inform you that your position has been made redundant.',
    reasonAbsconding: 'This decision has been taken due to your unauthorized and prolonged absence from work without prior intimation.',
    formalitiesLine: 'You are requested to complete all formalities, including the handover of company assets, documentation, and clearance procedures by your last working day. Your full and final settlement will be processed as per company policy.',
    wishLine: 'We thank you for your services and wish you success in your future endeavours.',
    closing: 'Sincerely,',
  });

  const handleStaticChange = (key, val) => setStaticText(prev => ({ ...prev, [key]: val }));

  const rs = (key) => (
    <span
      contentEditable={isEditMode}
      suppressContentEditableWarning
      onBlur={e => handleStaticChange(key, e.currentTarget.textContent)}
      style={{
        outline: isEditMode ? '1px dashed #3b82f6' : 'none',
        padding: isEditMode ? '1px 3px' : 0,
        borderRadius: '2px',
        backgroundColor: isEditMode ? 'rgba(59,130,246,0.05)' : 'transparent',
        display: 'inline',
      }}
    >{staticText[key]}</span>
  );

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8080/api/users');
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
      setEmployeeName(emp.full_name || '');
      setEmployeeId(emp.employee_id || '');
      setDesignation(emp.designation || '');
      setDepartment(emp.department || '');
      setGender(emp.gender || '');
    }
  };

  const openModal = () => {
    if (!employeeName || !designation || !terminationDate) {
      alert('Please fill in all required fields');
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setIsEditMode(false); };

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/termination-letters`, {
        employeeName, employeeId, designation, department, terminationDate, gender, signatory, reason
      }, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      console.error('Failure saving to Database:', error);
    }
    if (!previewRef.current) { console.error('Preview content not found'); return; }

    const contentClone = previewRef.current.cloneNode(true);
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Termination Letter - ${employeeName || 'Employee'}</title>
        <style>
          @page { margin: 0.8cm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #111; }
          .print-preview-content { max-width: 800px; margin: 0 auto; min-height: calc(100vh - 1.6cm); box-sizing: border-box; padding: 88px 20px 72px 20px; }
          .print-header img { position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 78px; margin: 0; display: block; object-fit: cover; }
          .footer-side img { position: fixed; bottom: 0; left: 0; right: 0; height: 58px; width: 100%; display: block; object-fit: cover; }
          @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
          [contenteditable] { outline: none !important; background: transparent !important; }
        </style>
      </head>
      <body>
        ${contentClone.innerHTML}
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleViewAll = () => navigate('/LetterGenrate');

  const sigName = signatory === 'HR Manager' ? 'HR Department' : signatory.includes('CEO') ? 'R.S. Pandey' : signatory;
  const sigTitle = signatory === 'HR Manager' ? 'HR Manager, DOAGuru Infosystems' : signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

  const reasonText = reason === 'Poor Performance' ? staticText.reasonPoorPerf
    : reason === 'Misconduct' ? staticText.reasonMisconduct
    : reason === 'Downsizing' ? staticText.reasonDownsizing
    : staticText.reasonAbsconding;

  return (
    <div className="dg-page-container">
      <div className="dg-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="dg-page-tag">Termination</span>
          <h1 className="dg-page-title">Generate Termination Letter</h1>
        </div>
        <button onClick={handleViewAll} className="dg-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          View all PDFs
        </button>
      </div>

      <div className="dg-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fill in the details to generate the <strong>termination letter</strong></p>
        </div>

        <form>
          <div className="dg-form-section">
            <p className="dg-form-section-title">Select Employee</p>
            <div className="dg-form-group">
              <label className="dg-label">Search and Select Employee</label>
              <SearchableSelect options={employeeOptions} onChange={handleEmployeeSelect} placeholder={loading ? "Loading employees..." : "-- Select Employee --"} />
            </div>
          </div>

          <div className="dg-form-section">
            <p className="dg-form-section-title">Employee Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group">
                <label className="dg-label">Employee Name</label>
                <input type="text" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Employee ID</label>
                <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="dg-input" />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Designation</label>
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="dg-input" />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Termination Date</label>
                <input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="dg-input" required>
                  <option value="">-- Select Gender --</option>
                  <option value="He">Male (He/Him)</option>
                  <option value="She">Female (She/Her)</option>
                  <option value="They">Other (They/Them)</option>
                </select>
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Reason for Termination</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="dg-input" required>
                  <option value="Poor Performance">Poor Performance</option>
                  <option value="Misconduct">Misconduct</option>
                  <option value="Downsizing">Downsizing / Redundancy</option>
                  <option value="Absconding">Absconding / Unauthorized Absence</option>
                </select>
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Signatory</label>
                <select value={signatory} onChange={(e) => setSignatory(e.target.value)} className="dg-input" required>
                  <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                  <option value="HR Manager">HR Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dg-form-actions">
            <button type="button" onClick={openModal} className="dg-btn-secondary">Preview Termination Letter</button>
          </div>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customStyles} contentLabel="Termination Letter Preview">
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#1a1a2e' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Termination Letter — {employeeName || 'Employee'}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditMode(!isEditMode)} style={{ padding: '0.45rem 0.9rem', background: isEditMode ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '7px', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
              {isEditMode ? '✓ Save Content' : '✎ Edit Content'}
            </button>
            <button onClick={handlePrint} style={{ padding: '0.45rem 0.9rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '7px', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
              Print / Save PDF
            </button>
            <button onClick={closeModal} style={{ padding: '0.45rem 0.9rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '7px', color: '#f43f5e', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
              Close
            </button>
          </div>
        </div>

        {isEditMode && (
          <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.6rem 1.5rem', fontSize: '0.78rem', color: '#3b82f6' }}>
            ✎ Edit mode active — click on any highlighted text to modify it. Dynamic fields (name, dates, designation) remain locked.
          </div>
        )}

        {/* Letter Content */}
        <div style={{ padding: '1rem' }}>
          <div ref={previewRef} className="print-preview-content" style={{ background: 'white', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="print-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img src={headerImg} alt="Header" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', marginTop: '0.5rem' }}>TERMINATION LETTER</h1>
            </div>

            <img src={CLogo} alt="Logo" style={{ width: '12rem' }} />

            <div className="print-content" style={{ color: 'black', fontSize: '0.9rem', lineHeight: 1.75 }}>
              <p>DOAGuru Infosystems<br />
                1815 Wright Town, Jabalpur,<br />
                Madhya Pradesh, INDIA – 482002<br />
                Phone: +91-7440992424<br />
                Email: info@doaguru.com<br />
                Website: https://doaguru.com</p>

              <p style={{ marginTop: '1rem' }}>Date: {moment().tz('Asia/Kolkata').format('DD MMMM YYYY')}</p>

              <p style={{ marginTop: '1rem' }}>To,</p>
              <p style={{ fontWeight: 600 }}>
                {employeeName || '[Employee Name]'}<br />
                {designation || '[Employee Designation]'}<br />
                Employee ID: {employeeId || '[Employee ID]'}
              </p>

              <p style={{ fontWeight: 700, marginTop: '1.5rem' }}>{rs('subject')}</p>

              <p style={{ marginTop: '1rem' }}>{rs('greeting')} {employeeName || 'Employee'},</p>

              <p style={{ marginTop: '0.75rem' }}>
                {rs('regretLine')} <strong>{designation || '[Designation]'}</strong> {rs('inDept')} <strong>{department || 'Development'}</strong> {rs('deptSuffix')} <strong>{terminationDate ? moment.tz(terminationDate, 'Asia/Kolkata').format('DD MMMM YYYY') : '[Termination Date]'}</strong>.
              </p>

              <p style={{ marginTop: '0.75rem' }}>
                {rs('considerationLine')} {' '}
                <span
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={e => {
                    const key = reason === 'Poor Performance' ? 'reasonPoorPerf'
                      : reason === 'Misconduct' ? 'reasonMisconduct'
                      : reason === 'Downsizing' ? 'reasonDownsizing'
                      : 'reasonAbsconding';
                    handleStaticChange(key, e.currentTarget.textContent);
                  }}
                  style={{ outline: isEditMode ? '1px dashed #3b82f6' : 'none', padding: isEditMode ? '1px 3px' : 0, borderRadius: '2px', backgroundColor: isEditMode ? 'rgba(59,130,246,0.05)' : 'transparent', display: 'inline' }}
                >{reasonText}</span>
              </p>

              <p style={{ marginTop: '0.75rem' }}>{rs('formalitiesLine')}</p>

              <p style={{ marginTop: '0.75rem' }}>{rs('wishLine')}</p>

              <div style={{ marginTop: '2.5rem' }}>
                <p>{rs('closing')}</p>
                <img src={imgS} alt="Signature" style={{ width: '7rem', marginTop: '0.5rem' }} />
                <p style={{ fontWeight: 700 }}>
                  {sigName}<br />{sigTitle}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <img src={footerImg} alt="Footer" style={{ width: '100%', height: '60px', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TerminationLetter;
