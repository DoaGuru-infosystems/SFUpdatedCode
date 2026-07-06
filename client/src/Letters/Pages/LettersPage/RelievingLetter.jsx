import { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
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

const RelievingLetter = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [dateOfRelieving, setDateOfRelieving] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [gender, setGender] = useState('');
  const [signatory, setSignatory] = useState('R.S. Pandey (CEO)');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef();

  const [staticText, setStaticText] = useState({
    salutation: 'To Whom It May Concern,',
    certifyText: 'This is to certify that',
    wasEmployed: 'was employed with DOAGuru Infosystems in the',
    departmentLabel: 'Department as a',
    fromText: 'from',
    toText: 'to',
    tenureIntro: 'During',
    tenureDesc: 'tenure, we found',
    tenureQualities: 'to be sincere, hardworking, and dedicated to',
    responsibilities: 'responsibilities.',
    completedText: 'have completed all handovers and formalities, and accordingly, we hereby relieve',
    dutiesText: 'from',
    dutiesEnd: 'duties with effect from the close of business on',
    wishText: 'We wish',
    futureText: 'all the very best in',
    futureEnd: 'future endeavors.',
    regards: 'Warm regards,',
  });

  const departments = ['Marketing', 'Development', 'Sales', 'HR', 'Design', 'IT'];

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://sf.doaguru.com/api/users');
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
      setDesignation(emp.designation || '');
      setDepartment(emp.department || '');
      if (emp.joiningDate) {
        setDateOfJoining(new Date(emp.joiningDate).toISOString().split('T')[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

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
        minWidth: isEditMode ? '10px' : 'auto',
        display: 'inline',
      }}
    >{staticText[key]}</span>
  );

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/relieving-letters`, {
        employeeName, department, designation, dateOfJoining, dateOfRelieving, lastWorkingDay, gender: gender?.value || gender, signatory
      }, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      console.error('Failure saving to Database:', error);
    }
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${employeeName} Relieving Letter</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; }
          .print-container { max-width: 800px; margin: 0 auto; position: relative; min-height: calc(100vh - 2cm); box-sizing: border-box; padding: 0px 20px 20px 20px; }
          .header-image { position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 78px; display: block; object-fit: cover; margin-bottom: 12px; }
          .logo-header { max-width: 7rem; margin-bottom: 10px; margin-left: 10px; }
          .print-content p { margin: 10px 0; text-align: justify; }
          .signature-img { padding-top: 1rem; margin-left: 3rem; width: 8rem; }
          .ceo-head { font-weight: bold; }
          .headName { margin-left: 4rem; }
          .footer-image { position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 58px; display: block; object-fit: cover; }
          @page { margin: 1cm; }
          @media print { body { -webkit-print-color-adjust: exact; } }
          [contenteditable] { outline: none !important; background: transparent !important; }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${previewRef.current.innerHTML}
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function () {
      setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    };
  };

  const closeModal = () => { setIsModalOpen(false); setIsEditMode(false); };

  const g = gender?.value || gender;
  const pr_their = g === 'He' ? 'his' : g === 'She' ? 'her' : 'their';
  const pr_them = g === 'He' ? 'him' : g === 'She' ? 'her' : 'them';
  const pr_he = g === 'He' ? 'He' : g === 'She' ? 'She' : 'They';
  const pr_their_fut = ['He', 'She'].includes(g) ? (g === 'He' ? 'his' : 'her') : 'their';
  const sigName = signatory === 'HR Manager' ? 'HR Department' : signatory.includes('CEO') ? 'R.S. Pandey' : signatory;
  const sigTitle = signatory === 'HR Manager' ? 'HR Manager, DOAGuru Infosystems' : signatory.includes('CEO') ? 'CEO, DOAGuru Infosystems' : 'Authorized Signatory';

  return (
    <div className="dg-page-container">
      <div className="dg-page-header">
        <span className="dg-page-tag">Relieving</span>
        <h1 className="dg-page-title">Generate Relieving Letter</h1>
      </div>

      <div className="dg-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Fill in the details to generate the <strong>relieving letter</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
                <input type="text" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Department</label>
                <SearchableSelect
                  options={departments.map(dept => ({ label: dept, value: dept }))}
                  value={department}
                  onChange={setDepartment}
                  placeholder="-- Select Department --"
                />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Designation</label>
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Gender</label>
                <select value={gender?.value || gender} onChange={(e) => setGender(e.target.value)} className="dg-input" required>
                  <option value="">-- Select Gender --</option>
                  <option value="He">Male (He/Him)</option>
                  <option value="She">Female (She/Her)</option>
                  <option value="They">Other (They/Them)</option>
                </select>
              </div>
              <div className="dg-form-group col-span-1 md:col-span-2 lg:col-span-4">
                <label className="dg-label">Signatory</label>
                <select value={signatory} onChange={(e) => setSignatory(e.target.value)} className="dg-input" required>
                  <option value="R.S. Pandey (CEO)">R.S. Pandey (CEO)</option>
                  <option value="HR Manager">HR Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dg-form-section">
            <p className="dg-form-section-title">Employment Timeline</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
              <div className="dg-form-group">
                <label className="dg-label">Date of Joining</label>
                <input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Date of Relieving</label>
                <input type="date" value={dateOfRelieving} onChange={(e) => setDateOfRelieving(e.target.value)} className="dg-input" required />
              </div>
              <div className="dg-form-group">
                <label className="dg-label">Last Working Day</label>
                <input type="date" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} className="dg-input" required />
              </div>
            </div>
          </div>

          <div className="dg-form-actions">
            <button type="submit" className="dg-btn-secondary">Preview Letter</button>
          </div>
        </form>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Relieving Letter Preview" style={customStyles} shouldCloseOnOverlayClick={true}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#1a1a2e' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Relieving Letter — {employeeName || 'Employee'}</h3>
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

        {/* Letter Preview */}
        <div ref={previewRef} style={{ background: 'white', padding: '2.5rem' }}>
          <img src={headerImg} alt="Header" style={{ width: '100%', height: '78px', objectFit: 'cover', display: 'block', marginBottom: '1rem' }} />
          <h1 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: '#111' }}>RELIEVING LETTER</h1>
          <img src={CLogo} alt="Logo" style={{ width: '7rem', marginBottom: '0.75rem' }} />

          <div style={{ color: 'black', fontSize: '0.9rem', lineHeight: 1.75 }}>
            <p>1815, Wright Town, Jabalpur<br />Madhya Pradesh, 482002<br />
              Phone: +91-7440992424<br />
              Email: info@doaguru.com<br />
              Website: <a href="https://doaguru.com" style={{ color: '#2563eb' }}>https://doaguru.com</a></p>

            <p style={{ marginTop: '1rem' }}>Date: {moment().tz('Asia/Kolkata').format('DD MMMM YYYY')}</p>

            <p style={{ marginTop: '1.5rem' }}>{rs('salutation')}</p>

            <p style={{ marginTop: '1rem' }}>
              {rs('certifyText')} <strong>{employeeName || '[Employee Name]'}</strong> {rs('wasEmployed')} <strong>{department || '[Department]'}</strong> {rs('departmentLabel')} <strong>{designation || '[Designation]'}</strong> {rs('fromText')} <strong>{dateOfJoining ? moment.tz(dateOfJoining, 'Asia/Kolkata').format('DD MMMM YYYY') : '[Date of Joining]'}</strong> {rs('toText')} <strong>{dateOfRelieving ? moment.tz(dateOfRelieving, 'Asia/Kolkata').format('DD MMMM YYYY') : '[Date of Relieving]'}</strong>.
            </p>

            <p style={{ marginTop: '1rem' }}>
              {rs('tenureIntro')} {pr_their} {rs('tenureDesc')} {pr_them} {rs('tenureQualities')} {pr_their} {rs('responsibilities')} {pr_he} {rs('completedText')} {pr_them} {rs('dutiesText')} {pr_their} {rs('dutiesEnd')} <strong>{lastWorkingDay ? moment.tz(lastWorkingDay, 'Asia/Kolkata').format('DD MMMM YYYY') : '[Last Working Day]'}</strong>.
            </p>

            <p style={{ marginTop: '1rem' }}>
              {rs('wishText')} <strong>{employeeName || '[Employee Name]'}</strong> {rs('futureText')} {pr_their_fut} {rs('futureEnd')}
            </p>

            <p style={{ marginTop: '1.5rem' }}>{rs('regards')}</p>

            <div style={{ marginTop: '2rem' }}>
              <img src={imgS} alt="Authorized Signatory" style={{ width: '7rem', marginLeft: '3rem', marginTop: '1rem' }} />
              <p style={{ fontWeight: 700, marginLeft: '4rem', marginTop: '0.25rem' }}>{sigName}</p>
              <p style={{ marginLeft: '4rem' }}>{sigTitle}</p>
            </div>
          </div>

          <img src={footerImg} alt="Footer" style={{ width: '100%', height: '58px', objectFit: 'cover', display: 'block', marginTop: '2rem' }} />
        </div>
      </Modal>
    </div>
  );
};

export default RelievingLetter;
