import { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import imgS from '../../assets/images/CEOSignature.png';
import axios from 'axios';
import CLogo from '../../assets/images/CLogo.png';
import headerImg from '../../assets/images/NewFotterImage.png';
import footerImg from '../../assets/images/NewFotterImage.png';


const OfferLater = () => {

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [offerReleaseDate, setOfferReleaseDate] = useState('');
  const [benefits, setBenefits] = useState('');
  const [officeTimings, setOfficeTimings] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState(['']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewRef = useRef();
  const [letterData, setLetterData] = useState(
    {
      name,
      offerReleaseDate,
      joiningDate: date,
      designation: position,
      salary,
      benefits,
      officeTimings,
      noticePeriod,
      jobResponsibilities

    }
  )

  const handleSaveInfo = async () => {

    try {

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/saveOfferLetter`, letterData);
      console.log(response.data, 'here data');
      if (response.status === 200) {
        console.log(response.data);
        handlePrint();
        console.log('Employee Letter Info Save');
      } else {
        console.log('Failled to save leeter info...');
      }
    } catch (error) {
      console.log('here is a error ', error);
    }
  };

  // const handleChange = () =>{

  // }

  const handleJobResponsibilitiesChange = (index, value) => {
    const updatedResponsibilities = [...jobResponsibilities];
    updatedResponsibilities[index] = value;
    setJobResponsibilities(updatedResponsibilities);
  };

  const addJobResponsibility = () => {
    setJobResponsibilities([...jobResponsibilities, '']);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    const printContent = previewRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<html><head><title>${name} Offer Letter</title>`);
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
      }
      .print-container {s
        max-width: 800px;
        margin: auto;
      }
      .print-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .print-header img {
        width: 10rem;
        position: absolute;
        top: auto;
        right: 0;
      }
      .logo-header {
        max-width: 7rem;
        margin-bottom: 10px;
        margin-left: 10px;
      }
      .signature-img{
        padding-top: 1rem;
        margin-left: 3rem;
        width: 8rem;

      }
      .ceo-head{
        font-weight: bold;
      }
      .headName{
        margin-left: 4rem;
      }
      .print-header h1 {
        font-size: 24px;
        margin: 0;
      }
        .release-date{
        display: flex;
        justify-content: end;
        }
      .print-content p {
        margin: 10px 0;
      }
      .heading-letter{
      padding-top: 4.5rem;
      }
        
      .print-content p span {
        font-weight: bold;
      }
      .print-content ul {
        list-style-type: disc;
        padding-left: 20px;
      }
      .print-content ul li {
        margin: 5px 0;
      }
      .header-image {
        width: 100%;
        max-width: 100%;
        height: auto;
        margin-bottom: 1rem;
      }
      
      .footer-image {
        width: 100%;
        max-width: 100%;
        height: 5rem;
        position: absolute;
        bottom: 0;
      }
      
      @media print {
        .header-image, .footer-image {
          break-inside: avoid;
        }
      }
    `);
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="print-container">');
    printWindow.document.write(printContent);
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };
  useEffect(() => {
    setLetterData({
      name,
      offerReleaseDate,
      joiningDate: date,
      designation: position,
      salary,
      benefits,
      officeTimings,
      noticePeriod,
      jobResponsibilities

    });
  }, [
    name,
    offerReleaseDate,
    date,
    position,
    salary,
    benefits,
    officeTimings,
    noticePeriod,
    jobResponsibilities

  ]);

  return (
    <div className="container mx-auto p-4">
      <form className="bg-white p-6 rounded-lg shadow-lg mb-4">
        <h2 className="text-2xl font-bold mb-4">Generate Offer Letter</h2>
        {/* Form Fields */}
        <div className="mb-4">
          <label className="block text-gray-700">Candidate Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        {/* <div className="mb-4">
          <label className="block text-gray-700">Mobile Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div> */}

        <div className="mb-4">
          <label className="block text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Position</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Salary</label>
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Offer Release Date</label>
          <input
            type="date"
            value={offerReleaseDate}
            onChange={(e) => setOfferReleaseDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Benefits</label>
          <input
            type="text"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Office Timings</label>
          <input
            type="text"
            value={officeTimings}
            onChange={(e) => setOfficeTimings(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Notice Period</label>
          <input
            type="text"
            value={noticePeriod}
            onChange={(e) => setNoticePeriod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Job Responsibilities</label>
          {jobResponsibilities.map((responsibility, index) => (
            <input
              key={index}
              type="text"
              value={responsibility}
              onChange={(e) => handleJobResponsibilitiesChange(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1 mb-2"
              required
            />
          ))}
          <button type="button" onClick={addJobResponsibility} className=" border-2 border-green-400 text-black py-2 px-4 rounded">
            Add Job Responsibility
          </button>
        </div>
        <button type="button" onClick={openModal} className=" border border-gray-950 text-black py-2 px-4 rounded" >
          Preview Offer Letter
        </button>
      </form>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Preview Modal">
        <div ref={previewRef} className="p-6 bg-white rounded-lg shadow-lg">
          {/* Offer Letter Preview Content */}
          <div className="print-header">
            <img src={headerImg} alt="Header" style={{width: '10rem', position: 'absolute', top: 'auto', right: '0'}} className="header-image" />
            <h1 className="text-xl font-bold pt-7 text-center heading-letter">OFFER LETTER</h1>
          </div>
          <img src={CLogo} alt="Logo" className='w-24 logo-header' />
          <div className="print-content">
            <p>1815, Wright Town, Jabalpur<br />Madhya Pradesh, 482002<br /><a href="http://www.doaguru.com" target='_blank' className='text-blue-900'>www.doaguru.com</a></p>
            <div className='release-date flex justify-end'>

              <p className='font-bold'><span>Offer Release Date: {offerReleaseDate}</span></p>
            </div>
            <p>Dear {name},</p>
            <p>Congratulations! We are pleased to offer you the position of <span className='font-bold'>{position} </span> at DOAGuru Infosystems. Your skills, experience, and enthusiasm align perfectly with our company’s goals and vision, and we believe you will make a valuable addition to our team.</p>
            <p><span className='font-bold'>Joining Date: {date}</span></p>
            <p><span className='font-bold'> Salary:</span> {salary} INR Per Month</p>
            <p><span className='font-bold'>Benefits:</span> {benefits}</p>
            <p><span className='font-bold'>Office Timings:</span> {officeTimings}</p>
            <p><span className='font-bold'>Notice Period:</span> {noticePeriod}</p>
            <p><span className='font-bold'>Job Responsibilities:</span></p>
            <ul>
              {jobResponsibilities.map((responsibility, index) => (
                <li key={index}>{responsibility}</li>
              ))}
            </ul>
            <p>Finally, we welcome you to DOAGuru InfoSystems and hope that your tenure with us will be long and beneficial. If you have any queries regarding the contents of this letter or the enclosed documents, please do not hesitate to contact the HR Team: info@doaguru.com.</p>
            <p>Please confirm your acceptance of this offer by 2 Days.</p>
            <p>We look forward to having you as part of our team.</p>
            <img src={imgS} alt="Signature" className='w-28 ms-14 mt-4 signature-img' />
            <p className='mt-1 font-bold ceo-head'><span className='headName ms-16'>R.S.Pandey</span><br />(CEO) DOAGuru InfoSystems.</p>
          </div>
          <img src={footerImg} alt="Footer" className="footer-image" />
        </div>
        <button onClick={() => handleSaveInfo()} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">Print Offer Letter</button>
        <button onClick={closeModal} className="bg-red-500 text-white py-2 px-4 rounded mt-4 ml-2">Close</button>
      </Modal>
    </div>
  );
}

export default OfferLater;
