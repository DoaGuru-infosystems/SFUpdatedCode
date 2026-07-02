// import { useState } from 'react';

// function 1OfferLater() {
//   const [name, setName] = useState('');
//   const [date, setDate] = useState('');
//   const [position, setPosition] = useState('');
//   const [salary, setSalary] = useState('');
//   const [offerReleaseDate, setOfferReleaseDate] = useState('');
//   const [benefits, setBenefits] = useState('');
//   const [officeTimings, setOfficeTimings] = useState('');
//   const [noticePeriod, setNoticePeriod] = useState('');
//   const [jobResponsibilities, setJobResponsibilities] = useState(['']);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const response = await fetch(`${process.env.REACT_APP_API_URL}/generate-pdf`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         name,
//         date,
//         position,
//         salary,
//         offerReleaseDate,
//         benefits,
//         officeTimings,
//         noticePeriod,
//         jobResponsibilities,
//       }),
//     });
//     const blob = await response.blob();
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'offer_letter.pdf';
//     a.click();
//   };

//   const handleJobResponsibilitiesChange = (index, value) => {
//     const updatedResponsibilities = [...jobResponsibilities];
//     updatedResponsibilities[index] = value;
//     setJobResponsibilities(updatedResponsibilities);
//   };

//   const addJobResponsibility = () => {
//     setJobResponsibilities([...jobResponsibilities, '']);
//   };

//   return (
//     <div className="container mx-auto p-4  ">
//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
//         <h2 className="text-2xl font-bold mb-4">Generate Offer Letter</h2>
//         <div className="mb-4">
//           <label className="block text-gray-700">Candidate Name</label>
//           <input
//             type="text"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Date</label>
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Position</label>
//           <input
//             type="text"
//             value={position}
//             onChange={(e) => setPosition(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Salary Per Month</label>
//           <input
//             type="text"
//             value={salary}
//             onChange={(e) => setSalary(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Offer Release Date</label>
//           <input
//             type="date"
//             value={offerReleaseDate}
//             onChange={(e) => setOfferReleaseDate(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Benefits</label>
//           <input
//             type="text"
//             value={benefits}
//             onChange={(e) => setBenefits(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Office Timings</label>
//           <input
//             type="text"
//             value={officeTimings}
//             onChange={(e) => setOfficeTimings(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Notice Period</label>
//           <input
//             type="text"
//             value={noticePeriod}
//             onChange={(e) => setNoticePeriod(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded mt-1"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700">Job Responsibilities</label>
//           {jobResponsibilities.map((responsibility, index) => (
//             <input
//               key={index}
//               type="text"
//               value={responsibility}
//               onChange={(e) => handleJobResponsibilitiesChange(index, e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded mt-1 mb-2"
//               required
//             />
//           ))}
//           <button type="button" onClick={addJobResponsibility} className="bg-green-500 text-white py-2 px-4 rounded">
//             Add Job Responsibility
//           </button>
//         </div>
//         <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
//           Generate Offer Letter
//         </button>
//       </form>
//     </div>
//   );
// }

// export default 1OfferLater;
