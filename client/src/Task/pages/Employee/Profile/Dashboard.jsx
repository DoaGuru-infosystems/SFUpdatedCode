import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaIdCard, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [editableProfile, setEditableProfile] = useState(null); // Editable profile for modal
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  const employeeId = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Fetch employee data on component mount
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/getEmployee/${employeeId.id}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchEmployeeData();
  }, [employeeId]);

  const openEditModal = () => {
    setEditableProfile({ ...profile }); // Copy profile data to editableProfile when opening modal
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append('fullName', editableProfile.full_name);
    formData.append('mobileNumber', editableProfile.mobile_number);
    formData.append('designation', editableProfile.designation);
    formData.append('bloodGroup', editableProfile.bloodGroup);
    formData.append('dob', editableProfile.DOB);
    formData.append('joiningDate', editableProfile.joiningDate);
    formData.append('address', editableProfile.address);
    formData.append('idNumber', editableProfile.id);
    formData.append('department', editableProfile.department);

    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }
    console.log(formData);

    try {
      const response = await axios.post('http://localhost:8080/api/updateEmployee', formData, {
        // const response = await axios.post('http://localhost:8080/api/updateEmployee', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        alert('Profile updated successfully!');
        setProfile(editableProfile); // Update main profile with edited values
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          {/* Animated loader with pulsing circles */}
          <div className="flex space-x-3">
            <div className="h-5 w-5 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="h-5 w-5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-5 w-5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Loading text */}
          <div className="mt-4 text-lg font-semibold text-gray-700">Loading your profile</div>
          <div className="text-sm text-gray-500 mt-2">Please wait a moment...</div>
        </div>
      </div>
    );
  }

  console.log(profile);


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/6 bg-gray-800 text-white flex flex-col items-center py-8">
        <ul className="space-y-4 mt-5">
          {/* Profile */}
          <li className="text-lg cursor-pointer hover:text-blue-300 flex items-center">
            <Link to="/task/EmployeeDashboard"><FaUser className="mr-2 text-xl" /></Link>
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

      {/* Profile Section */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-gray-700 mb-6">Profile Information</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-6 mb-6">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={profile.profileIMG?.replace("http://localhost:8080", "http://localhost:8080") || 'https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{profile.full_name}</h2>
              <p className="text-gray-600">{profile.designation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Profile Information */}
            <p><strong>ID Number:</strong> DG0000{profile.id}</p>
            <p><strong>Mobile Number:</strong> {profile.mobile_number}</p>
            <p><strong>Blood Group:</strong> {profile.bloodGroup}</p>
            <p><strong>Date of Birth:</strong> {profile.DOB}</p>
            <p><strong>Joining Date:</strong> {profile.joiningDate}</p>
            <p><strong>Address:</strong> {profile.address}</p>
            <p><strong>Department:</strong> {profile.department || 'Not specified'}</p>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={openEditModal}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal for Editing Profile */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-semibold mb-4">Update Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'Full Name', value: 'full_name' }, { label: 'Designation', value: 'designation' }, { label: 'ID Number', value: 'id' }, { label: 'Mobile Number', value: 'mobile_number' }, { label: 'Blood Group', value: 'bloodGroup' }, { label: 'Date of Birth', value: 'DOB', type: 'date' }, { label: 'Joining Date', value: 'joiningDate', type: 'date' }, { label: 'Address', value: 'address' }].map((field) => (
                <div key={field.value} className="flex flex-col">
                  <label className="text-gray-700">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    name={field.value}
                    value={editableProfile[field.value] || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}

              {/* Department Dropdown */}
              <div className="flex flex-col">
                <label className="text-gray-700">Department</label>
                <select
                  name="department"
                  value={editableProfile.department || ""}
                  onChange={handleInputChange}
                  className="mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Department</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Development">Development</option>
                  <option value="SEO">SEO</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              {/* Profile Picture Update */}
              <div className="flex flex-col col-span-2">
                <label className="text-gray-700">Profile Picture</label>
                <input
                  type="file"
                  onChange={handleProfilePictureChange}
                  className="mt-1 p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
