import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaIdCard, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../../../../assets/images/DG Logo1.png'
// import shape from '../../../../assets/images/Shape.png'
import shape from '../../../../assets/images/Shape2.png'
// import line from '../../../../assets/images/Line.png'
import line from '../../../../assets/images/Line2.png'
import signature from '../../../../assets/images/signature.jpg'

function EmployeeCard() {

  const [employeeData, setEmployeeData] = useState(null);
  const [error, setError] = useState(null);
  // console.log(employeeData);

  const employeeId = JSON.parse(localStorage.getItem('user'));

  // Add CSS styles for print media
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'print-styles';

    // Add print-specific styles
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #card, #card * {
          visibility: visible;
        }
        // #card {
        //   position: absolute;
        //   left: 0;
        //   top: 0;
        //   width: 100%;
        //   height: 100%;
        //   display: flex;
        //   justify-content: center;
        //   align-items: center;
        //   margin: 0;
        //   padding: 0;
        // }
        .print-button {
          display: none !important;
        }
      }
    `;

    // Append the style element to the document head
    document.head.appendChild(style);

    // Cleanup function to remove the style element when component unmounts
    return () => {
      const styleElement = document.getElementById('print-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    // Fetch employee data on component mount
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/getEmployee/${employeeId.id}`);
        setEmployeeData(response.data);
        // console.log(response.data);

      } catch (error) {
        setError('Failed to load employee data');
        console.error('Error:', error);
      }
    };
    fetchEmployeeData();
  }, [employeeId]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!employeeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            {/* Animated loader with multiple circles */}
            <div className="flex space-x-2 justify-center items-center">
              <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-4 w-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-4 w-4 bg-blue-700 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              <div className="h-4 w-4 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>

            {/* Animated text with dots */}
            <div className="mt-4 text-lg font-semibold text-gray-700 flex">
              <span>Loading</span>
              <span className="ml-1 flex w-12">
                <span className="animate-pulse" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Fetching your employee card</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (

    <div className="flex min-h-screen bg-gray-100 overflow-scroll">
      {/* Sidebar */}
      <div className="w-1/6 bg-gray-800 text-white flex flex-col items-center py-8">
        <ul className="space-y-4 mt-5">
          {/* Profile */}
          <li className="text-lg cursor-pointer hover:text-blue-300 flex items-center">
            <Link to="/task//EmployeeDashboard"><FaUser className="mr-2 text-xl" /></Link>
            <Link to="" className="hidden md:inline">Profile</Link>
          </li>

          {/* Employee Card */}
          <li className="text-lg cursor-pointer hover:text-blue-300 flex items-center">
            <Link to="/task/EmployeeProfile Card"><FaIdCard className="mr-2 text-xl" /></Link>
            <Link to="/task/EmployeeProfile Card" className="hidden md:inline">Employee Card</Link>
          </li>

          {/* Logout */}
          <li className="text-lg cursor-pointer hover:text-blue-300 flex items-center">
            <FaSignOutAlt className="mr-2 text-xl" />
            <span className="hidden md:inline">Report</span>
          </li>
        </ul>
      </div>

      <div className='flex-1 flex flex-column justify-center items-center '>
        {/* Card Container */}
        <div id="card" className="w-[40rem] h-[30rem] flex gap-3 border-2 border-gray-300 shadow-lg bg-white print:border-none">

          {/* Front Side */}
          <div id="front-side" className="w-[20rem] flex flex-col border-2 border-gray-900 rounded-lg bg-white overflow-hidden">
            {/* Full card layout with diagonal blue shape */}
            <div className="relative w-full h-full">
              {/* Diagonal blue shape background */}
              <img src={shape} alt="Shape" className='w-full mt-4' />

              {/* Logo at top */}
              <div className="absolute top-2 left-[7rem]">
                <img src={logo} alt="Logo" className='w-[5rem]' />
              </div>

              {/* Profile image in circle in the middle of blue shape */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '3px solid white',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  boxShadow: '0 0 8px rgba(0,0,0,0.2)'
                }}>
                  <img
                    src={employeeData.profileIMG?.replace("http://localhost:8080", "http://localhost:8080")}
                    alt="Profile IMG"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Name and designation - centered at bottom of card */}
            <div className="flex flex-col items-center " style={{ marginTop: '-4.5rem' }}>
              <h2 className="text-xl font-bold">{employeeData.full_name}</h2>
              <p className="text-gray-700 text-sm">{employeeData.designation}</p>
            </div>

            {/* Employee information with proper alignment */}
            <div className="px-4 text-sm">
              <div className="flex flex-col gap-1 ">
                <div className="flex">
                  <span className="w-28 font-semibold">ID Number</span>
                  <span className="mr-1">:</span>
                  <span><strong>DG0000{employeeData.id}</strong></span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold">Department</span>
                  <span className="mr-1">:</span>
                  <span>{employeeData.department || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold">Mobile</span>
                  <span className="mr-1">:</span>
                  <span>{employeeData.mobile_number}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold">Blood Group</span>
                  <span className="mr-1">:</span>
                  <span>{employeeData.bloodGroup}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold">Address</span>
                  <span className="mr-1">:</span>
                  <span>{employeeData.address || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-start flex-col absolute">
                {/* idhart director signature lagana he */}
                <img src={signature} alt="Signature" className='w-[5rem] ' />
                <p>Director</p>
              </div>
            </div>
            <div className="mt-2">
              <img src={line} alt="Line" className='w-full ' />
            </div>
          </div>


          {/* Back Side */}
          <div id="back-side" className="w-[20rem] p-4 bg-white flex flex-col border-2 border-gray-900 rounded-lg">
            <div className="flex flex-col items-center">
              {/* Replace with company logo */}
              <img src={logo} alt="Company Logo" className="w-[13rem] " />
              {/* <p className="text-center text-sm font-semibold">DOAGuru InfoSystems</p>
              <p className="text-xs text-center mt-2">Transforming Tech Logically</p> */}
            </div>
            <div className='' >

              <div className="mt-4 text-xs">
                <h4 className="font-bold">Terms & Conditions:</h4>
                <p>This card is the property of DOAGuru InfoSystems. If found, please return it to the office. Misuse is prohibited.</p>
              </div>
              <div className="mt-4 text-xs">
                <h4 className="font-bold">Address:</h4>
                <p>1815 Wright Town,
                  Jabalpur, Madhya pradesh INDIA
                  482002 </p>
              </div>
              <div className="mt-4 text-xs flex flex-column items-start ">
                <h4 className="font-bold">Emergency Contact No:</h4>
                <p> +91-7440992424 </p>
              </div>
            </div>
          </div>

        </div>

        {/* Print Button */}
        <button onClick={handlePrint} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 print-button">
          Print Card
        </button>
      </div>
    </div>

  );
}

export default EmployeeCard;




