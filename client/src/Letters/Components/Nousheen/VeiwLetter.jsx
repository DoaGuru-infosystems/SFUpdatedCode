import { useState, useEffect } from 'react';
import axios from 'axios';

const ViewWarningLettersPage = () => {
  const [warningLetters, setWarningLetters] = useState([]);

  useEffect(() => {
    const fetchWarningLetters = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/getWarningLetters`);
        setWarningLetters(response.data);
      } catch (error){
        console.error('Failed to fetch warning letters:', error);
      }
    };

    fetchWarningLetters();
  }, []);

  const handleDownload = (id) => {
    window.open(`${process.env.REACT_APP_API_URL}/api/downloadPdf/${id}`, '_blank');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Warning Letters</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="border-b px-4 py-2">Name</th>
            <th className="border-b px-4 py-2">Warning Release Date</th>
            <th className="border-b px-4 py-2">Warning Details</th>
            <th className="border-b px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {warningLetters.map((letter) => (
            <tr key={letter.id}>
              <td className="border-b px-4 py-2">{letter.name}</td>
              <td className="border-b px-4 py-2">{letter.date}</td>
              <td className="border-b px-4 py-2">{letter.warningDetails}</td>
    
              <td className="border-b px-4 py-2">
                <button
                  onClick={() => handleDownload(letter.id)}
                  className="bg-blue-500 text-white py-2 px-4 rounded">
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewWarningLettersPage;