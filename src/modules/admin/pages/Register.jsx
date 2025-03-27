import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, addDoc } from '../../../firebaseConfig'; // Adjust the import path as needed

const Register = () => {
  const [formData, setFormData] = useState({
    userType: '',
    name: '',
    email: '',
    password: ''
  });

  const navigate = useNavigate(); // Initialize useNavigate
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Reference to the 'users' collection in Firestore
      const usersCollectionRef = collection(db, 'users');
      
      // Add a new document with the form data
      await addDoc(usersCollectionRef, formData);

      console.log("User registered successfully!");
      navigate('/');
      
      // Reset form
      setFormData({
        userType: '',
        name: '',
        email: '',
        password: ''
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      <div className="w-full max-w-lg bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-black text-center mb-8">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="block text-sm font-medium text-black">User Type</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border-2 border-gray-300 bg-gray-100 text-black"
              required
            >
              <option value="">Select User Type</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-black">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border-2 border-gray-300 bg-gray-100 text-black"
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-black">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border-2 border-gray-300 bg-gray-100 text-black"
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-black">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border-2 border-gray-300 bg-gray-100 text-black"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
