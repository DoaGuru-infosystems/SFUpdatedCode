import { useState } from 'react';
import axios from 'axios';
// import cogoToast from 'cogo-toast';

const RegisterUser = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        mobileNumber: '',
        emailId: '',
        designation: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.mobileNumber.length !== 10) {
            alert('Mobile number must be 10 digits');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        const { confirmPassword, ...dataToSend } = formData;
        axios.post('http://localhost:8080/api/register', dataToSend)
            .then(response => {
                console.log(response);
                alert(response.data.message);
                // Clear the form fields
                setFormData({
                    fullName: '',
                    mobileNumber: '',
                    emailId: '',
                    designation: '',
                    password: '',
                    confirmPassword: ''
                });
            })
            .catch(error => {
                console.error('Axios error:', error.response ? error.response.data : error.message); // Log the error details
                alert('An error occurred. Please try again.');
            });
    };

    return (
        <div>
            <div className='container w-75 m-auto border border-cyan-600 rounded-lg p-5'>
                <form onSubmit={handleSubmit} className='m-5 flex flex-col gap-3 justify-center'>
                    <h2 className='flex justify-center text-2xl font-black'>Register User</h2>
                    <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <input type="number" name="mobileNumber" placeholder="Mobile Number" value={formData.mobileNumber} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <input type="email" name="emailId" placeholder="Email ID" value={formData.emailId} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <input type="test" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className='m-2 p-3 border border-cyan-600 rounded-lg' />
                    <button type="submit" className='m-2 p-3 border border-cyan-600 rounded-lg hover:bg-cyan-100 font-bold'>Register</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterUser;
