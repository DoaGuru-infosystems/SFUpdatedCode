import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaBuilding,
  FaTint, FaBirthdayCake, FaCalendarCheck, FaMapMarkerAlt,
  FaIdCard, FaCreditCard, FaCar, FaBolt, FaHistory,
  FaExclamationTriangle, FaUniversity, FaQrcode,
  FaArrowLeft, FaEdit, FaFileAlt, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import UpdateEmployeeModal from "./UpdateEmployeeModal";
import SalaryManagement from "./SalaryManagement";
import CommitmentManagement from "./CommitmentManagement";

const EmployeeDetails = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchEmployeeDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/UserDataById/${empId}`);
      setEmployee(data[0]);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployeeDetails(); }, [empId]);

  const requiredFields = [
    "profileIMG", "full_name", "email_id", "mobile_number", "designation", "department",
    "bloodGroup", "DOB", "joiningDate", "address", "employment_status", "aadhar_number",
    "pan_number", "driving_licence", "previous_company_experience_letter",
    "previous_company_relieving_letter", "previous_employer_contact", "salary_slips",
    "graduation_degree_marksheets", "cancelled_cheque", "offer_letter", "emergency_contact",
    "bank_account_number", "bank_ifsc_number", "bank_upi_id", "aadhar_card_image", "pan_card_image"
  ];

  const profileScore = useMemo(() => {
    if (!employee) return 0;
    const filled = requiredFields.filter(f => employee[f] && employee[f] !== "").length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [employee]);

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm transition-all hover:shadow-md h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Icon size={14} />
        </div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="group">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5 flex items-center gap-1">
        {Icon && <Icon size={9} />} {label}
      </p>
      <p className="text-sm font-black text-slate-800 tracking-tight transition-colors group-hover:text-indigo-600">
        {value || <span className="text-slate-300 italic font-medium">Not provided</span>}
      </p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-bold text-sm animate-pulse uppercase tracking-widest">Compiling Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 pb-12">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* ═══ Header Identity Bar ═══ */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95">
              <FaArrowLeft size={16} />
            </button>
            <div className="relative group">
              <img
                src={employee?.profileIMG?.replace("http://localhost:3000", "http://localhost:3000") || "https://placehold.co/400x400?text=Profile"}
                alt="Profile"
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white shadow-lg ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-300"
              />
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${employee?.employment_status === 'active' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {employee?.employment_status || 'Unknown'}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1 italic">Enterprise ID: DOAG{empId}</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                {employee?.full_name}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 font-bold text-slate-500 text-xs">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1.5"><FaBriefcase size={10} /> {employee?.designation}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1.5"><FaBuilding size={10} /> {employee?.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Profile Integrity</span>
                <span className="text-xs font-black text-indigo-600">{profileScore}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${profileScore}%` }}
                  className={`h-full rounded-full ${profileScore > 80 ? 'bg-emerald-500' : profileScore > 40 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                />
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-xs whitespace-nowrap"
            >
              <FaEdit /> UPDATE DETAILS
            </button>
          </div>
        </div>

        {/* ═══ Categorized Information Sections ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Section title="Identity & Vitals" icon={FaUser}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Full Name" value={employee?.full_name} icon={FaIdCard} />
              <InfoRow label="DOB" value={employee?.DOB} icon={FaBirthdayCake} />
              <InfoRow label="Blood Group" value={employee?.bloodGroup} icon={FaTint} />
              <InfoRow label="Aadhar No" value={employee?.aadhar_number} icon={FaIdCard} />
              <InfoRow label="PAN No" value={employee?.pan_number} icon={FaCreditCard} />
              <InfoRow label="License" value={employee?.driving_licence} icon={FaCar} />
            </div>
          </Section>

          <Section title="Communications" icon={FaEnvelope}>
            <InfoRow label="Professional Email" value={employee?.email_id} icon={FaEnvelope} />
            <InfoRow label="Mobile Connection" value={employee?.mobile_number} icon={FaPhone} />
            <InfoRow label="Primary Address" value={employee?.address} icon={FaMapMarkerAlt} />
            <InfoRow label="Emergency Contact" value={employee?.emergency_contact} icon={FaExclamationTriangle} />
          </Section>

          <Section title="Workforce Profile" icon={FaBriefcase}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Designation" value={employee?.designation} />
              <InfoRow label="Department" value={employee?.department} />
              <InfoRow label="Joining Date" value={employee?.joiningDate} icon={FaCalendarCheck} />
              <InfoRow label="Status" value={employee?.employment_status} />
              <InfoRow label="Prev Experience" value={employee?.previous_employer_contact} icon={FaHistory} />
            </div>
          </Section>

          <Section title="Financial Repository" icon={FaUniversity}>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Account Number" value={employee?.bank_account_number} />
              <InfoRow label="IFSC Code" value={employee?.bank_ifsc_number} />
              <div className="col-span-2">
                <InfoRow label="UPI Address" value={employee?.bank_upi_id} />
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-2 flex items-center gap-1">
                  <FaQrcode size={9} /> Payment Artifact
                </p>
                {employee?.bank_barcode ? (
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 inline-block">
                    <img
                      src={`http://localhost:3000/${employee.bank_barcode}`}
                      alt="Bank Barcode"
                      className="w-24 h-24 object-contain contrast-125"
                    />
                  </div>
                ) : <span className="text-slate-300 italic text-xs">QR not uploaded</span>}
              </div>
            </div>
          </Section>

          <Section title="Document Library" icon={FaFileAlt}>
            <div className="space-y-2">
              {[
                { label: "Aadhar Card", link: employee?.aadhar_card_image },
                { label: "PAN Card", link: employee?.pan_card_image },
                { label: "Experience Letter", link: employee?.previous_company_experience_letter },
                { label: "Relieving Letter", link: employee?.previous_company_relieving_letter },
                { label: "Salary Records", link: employee?.salary_slips },
                { label: "Degree Marksheets", link: employee?.graduation_degree_marksheets },
                { label: "Cancelled Cheque", link: employee?.cancelled_cheque },
                { label: "Offer Letter", link: employee?.offer_letter },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-indigo-100 hover:bg-white group/doc">
                  <span className="text-[11px] font-bold text-slate-600 truncate mr-2">{doc.label}</span>
                  {doc.link ? (
                    <a
                      href={`http://localhost:3000/${doc.link}`} target="_blank" rel="noreferrer"
                      className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      VIEW
                    </a>
                  ) : (
                    <span className="text-[8px] font-black uppercase text-rose-400 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">MISSING</span>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Roles & Commitments" icon={FaCheckCircle}>
            <div className="h-full overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
              <CommitmentManagement employeeId={empId} readOnly={true} />
            </div>
          </Section>

        </div>

        {/* ═══ Salary Management Section ═══ */}
        <SalaryManagement
          employeeId={empId}
          baseSalary={employee?.salary_amount}
        />
      </div>

      <UpdateEmployeeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        employee={employee}
        empId={empId}
        fetchEmployeeDetails={fetchEmployeeDetails}
      />
    </div>
  );
};

export default EmployeeDetails;
