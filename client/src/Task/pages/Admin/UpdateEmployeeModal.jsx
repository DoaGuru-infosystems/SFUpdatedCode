import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import CommitmentManagement from "./CommitmentManagement";

const UpdateEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  empId,
  fetchEmployeeDetails,
}) => {
  const modalRef = useRef();
  const [formData, setFormData] = useState(employee || {});

  console.log(employee);

  useEffect(() => {
    setFormData(employee || {});
  }, [employee]);

  // Close when clicking outside
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const fadeScale = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 },
  };

  const backDrop = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "mobile_number") {
      value = value.replace(/\D/g, "");

      if (value.length > 10) return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileUpload = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleSubmit = async () => {
    try {
      const fd = new FormData();

      for (const key in formData) {
        const value = formData[key];

        if (value instanceof File) {
          fd.append(key, value);
        } else {
          // Skip appending if the value is essentially an empty string or the string 'null'
          // Also skip if it's a string that contains '/uploads/' (old file path), 
          // because we don't want to re-send the path to a field that should only be updated by a new FILE.
          if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            value !== "null" &&
            !(typeof value === "string" && value.includes("/uploads/"))
          ) {
            fd.append(key, value);
          }
        }
      }

      const response = await axios.put(
        `https://sf.doaguru.com/api/updateEmployeeKyc/${empId}`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchEmployeeDetails();
      alert("details updated successfully");
      onClose();
    } catch (error) {
      console.log(error);
      alert("failed to update details");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={backDrop}
        initial="hidden"
        animate="show"
        exit="hidden"
        onClick={handleOutsideClick}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          variants={fadeScale}
          initial="hidden"
          animate="show"
          exit="hidden"
          ref={modalRef}
          className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-4">
            Update Employee Details
          </h2>

          <div className="space-y-6">
            {/* PERSONAL INFO */}
            <h3 className="text-lg font-bold text-gray-700">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Profile Image
                </label>
                {employee?.profileIMG && (
                  <img
                    src={employee.profileIMG?.replace("http://sf.doaguru.com", "https://sf.doaguru.com")}
                    alt="Current Profile"
                    className="w-16 h-16 rounded-full object-cover mb-2 border"
                  />
                )}
                <input
                  name="profileIMG"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Full Name
                </label>
                <input
                  name="full_name"
                  value={formData.full_name || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email ID
                </label>
                <input
                  name="email_id"
                  value={formData.email_id || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  type="email"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Mobile Number
                </label>
                <input
                  name="mobile_number"
                  value={formData.mobile_number || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Designation
                </label>
                <input
                  name="designation"
                  value={formData.designation || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Department
                </label>

                <select
                  name="department"
                  value={formData.department || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">-select-</option>
                  <option value="development">Development</option>
                  <option value="digital marketing">Digital Marketing</option>
                  <option value="seo">SEO</option>
                  <option value="management">Management</option>
                  <option value="sales">Sales</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Blood Group
                </label>
                <input
                  name="bloodGroup"
                  value={formData.bloodGroup || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-semibold mb-1">DOB</label>
                <input
                  name="DOB"
                  value={formData.DOB || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  type="date"
                />
              </div>

              {/* Joining Date */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Joining Date
                </label>
                <input
                  name="joiningDate"
                  value={formData.joiningDate || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  type="date"
                />
              </div>

              {/* Address full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Employment Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Employment Status
                </label>

                <select
                  name="employment_status"
                  value={formData.employment_status || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">--select--</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* DOCUMENTS SECTION */}
            <h3 className="text-lg font-bold text-gray-700">KYC & Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aadhar Number */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Aadhar Number
                </label>
                <input
                  name="aadhar_number"
                  value={formData.aadhar_number || ""}
                  maxLength={12}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  PAN Number
                </label>
                <input
                  name="pan_number"
                  value={formData.pan_number || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Driving Licence */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Driving Licence
                </label>
                <input
                  name="driving_licence"
                  value={formData.driving_licence || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>


              {/* Previous Employer Contact */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Previous Employer Contact
                </label>
                <input
                  name="previous_employer_contact"
                  value={formData.previous_employer_contact || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Emergency Contact
                </label>
                <input
                  name="emergency_contact"
                  value={formData.emergency_contact || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {[
                ["aadhar_card_image", "Aadhar Card Image"],
                ["pan_card_image", "PAN Card Image"],
                ["previous_company_experience_letter", "Experience Letter"],
                ["previous_company_relieving_letter", "Relieving Letter"],
                ["salary_slips", "Salary Slips"],
                ["graduation_degree_marksheets", "Graduation Marksheets"],
                ["cancelled_cheque", "Cancelled Cheque"],
                ["offer_letter", "Offer Letter"],
              ].map(([name, label], idx) => (
                <div key={idx}>
                  <label className="block text-sm font-semibold mb-1">
                    {label}
                  </label>
                  <input
                    name={name}
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full p-2 border rounded-lg"
                    accept="image/*,application/pdf"
                  />
                </div>
              ))}
            </div>

            {/* BANK DETAILS SECTION */}
            <h3 className="text-lg font-bold text-gray-700">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Account Number */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Bank Account Number
                </label>
                <input
                  name="bank_account_number"
                  value={formData.bank_account_number || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter account number"
                />
              </div>

              {/* Bank IFSC Number */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Bank IFSC Number
                </label>
                <input
                  name="bank_ifsc_number"
                  value={formData.bank_ifsc_number || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter IFSC code"
                />
              </div>

              {/* Bank UPI ID */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Bank UPI ID
                </label>
                <input
                  name="bank_upi_id"
                  value={formData.bank_upi_id || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter UPI ID"
                />
              </div>

              {/* Bank Barcode / QR Upload */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Bank Barcode / QR Code
                </label>
                <input
                  name="bank_barcode"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Roles & Commitments inside Modal */}
          <div className="mt-8">
            <CommitmentManagement employeeId={empId} />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Update
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateEmployeeModal;
