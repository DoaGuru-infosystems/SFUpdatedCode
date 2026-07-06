import { useEffect, useState } from "react";
import axios from "axios";

function AssignDailyTarget() {
  // TODO: Replace this with actual logged-in employee ID from auth context or props

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTargets();
    // eslint-disable-next-line
  }, []);

  let user = localStorage.getItem('user');
  user = JSON.parse(user);

  if (!user || !user.id) {
    console.error('User ID not found');
    return;
  }
  const employeeId = user.id;
  // console.log(employeeId);

  const fetchTargets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:8080/api/getEmployeeWiseProjectTarget/${employeeId}`);
      setTargets(res.data.data || []);
      console.log(res.data.data);
    } catch (err) {
      setError("Failed to fetch assigned targets.");
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="TaskView min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Assigned Daily Targets</h1>
        <div className="bg-white rounded-xl shadow border border-black">
          <h3 className="text-lg font-bold px-6 pt-6 pb-2 text-black">Assigned Daily Targets</h3>
          {loading ? (
            <div className="p-6 text-center text-black">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : targets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No targets assigned yet.</div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="min-w-full border border-black bg-white">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="py-2 px-3 border-b border-black text-center">Company Name</th>
                    <th className="py-2 px-3 border-b border-black text-center">Assign Date</th>
                    <th className="py-2 px-3 border-b border-black text-center">Target Post</th>
                    <th className="py-2 px-3 border-b border-black text-center">Target Video</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((tgt, idx) => (
                    <tr key={idx} className="text-black hover:bg-gray-100">
                      <td className="py-2 px-3 border-b border-black text-center">{tgt.projectName}</td>
                      <td className="py-2 px-3 border-b border-black text-center">{formatDate(tgt.created_at)}</td>
                      <td className="py-2 px-3 border-b border-black text-center">{tgt.targetPost}</td>
                      <td className="py-2 px-3 border-b border-black text-center">{tgt.targetVideo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignDailyTarget;
