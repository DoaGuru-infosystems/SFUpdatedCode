import { useState, useEffect } from "react";
import axios from "axios";

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    emailId: "",
    designation: "",
    department: "",
    role: "user",
    employment_status: "active",
    password: "",
    confirmPassword: "",
  });

  const [departments, setDepartments] = useState([]);
  const [isOtherDept, setIsOtherDept] = useState(false);
  const [customDept, setCustomDept] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios
      .get((window.API_BASE || "") + "/api/admin/departments", { headers })
      .then((res) => {
        if (res.data && res.data.success) {
          setDepartments(res.data.data || []);
        }
      })
      .catch((err) => console.error("Error fetching departments:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDeptSelect = (e) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsOtherDept(true);
      setFormData((prev) => ({ ...prev, department: customDept }));
    } else {
      setIsOtherDept(false);
      setFormData((prev) => ({ ...prev, department: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.mobileNumber.length !== 10) {
      alert("Mobile number must be 10 digits");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const finalDept = isOtherDept ? customDept.trim() : formData.department;
    if (!finalDept) {
      alert("Please select or enter a department");
      return;
    }

    const { confirmPassword, ...dataToSend } = formData;
    dataToSend.department = finalDept;

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .post((window.API_BASE || "") + "/api/register", dataToSend, { headers })
      .then((response) => {
        alert(response.data.message || "User registered successfully");
        // Clear the form fields
        setFormData({
          fullName: "",
          mobileNumber: "",
          emailId: "",
          designation: "",
          department: "",
          role: "user",
          employment_status: "active",
          password: "",
          confirmPassword: "",
        });
        setIsOtherDept(false);
        setCustomDept("");
      })
      .catch((error) => {
        console.error(
          "Axios error:",
          error.response ? error.response.data : error.message
        );
        const msg = error.response?.data?.message || error.response?.data?.error || "An error occurred. Please try again.";
        alert(msg);
      });
  };

  return (
    <div>
      <div className="container w-75 m-auto border border-cyan-600 rounded-lg p-5">
        <form
          onSubmit={handleSubmit}
          className="m-5 flex flex-col gap-3 justify-center"
        >
          <h2 className="flex justify-center text-2xl font-black">
            Register User
          </h2>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />
          <input
            type="number"
            name="mobileNumber"
            placeholder="Mobile Number"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />
          <input
            type="email"
            name="emailId"
            placeholder="Email ID"
            value={formData.emailId}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />
          <input
            type="text"
            name="designation"
            placeholder="Designation"
            value={formData.designation}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />

          {/* Department Select Dropdown + Other */}
          <select
            name="departmentSelect"
            value={isOtherDept ? "Other" : (formData.department || "")}
            onChange={handleDeptSelect}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg bg-white text-gray-700"
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} {d.tl_name ? `(TL: ${d.tl_name})` : "(TL: Unassigned)"}
              </option>
            ))}
            <option value="Other">+ Other (Add New Department)</option>
          </select>
          {isOtherDept && (
            <input
              type="text"
              name="customDepartment"
              placeholder="Enter New Department Name"
              value={customDept}
              onChange={(e) => {
                setCustomDept(e.target.value);
                setFormData((prev) => ({ ...prev, department: e.target.value }));
              }}
              required
              className="m-2 p-3 border border-cyan-600 rounded-lg bg-indigo-50/60 font-semibold"
            />
          )}

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="m-2 p-3 border border-cyan-600 rounded-lg bg-white text-gray-700"
          >
            <option value="user">Employee (User)</option>
            <option value="team_lead">Team Lead</option>
            <option value="admin">Administrator</option>
          </select>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="m-2 p-3 border border-cyan-600 rounded-lg"
          />
          <button
            type="submit"
            className="m-2 p-3 border border-cyan-600 rounded-lg hover:bg-cyan-100 font-bold"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
