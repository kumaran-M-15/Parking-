import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

// Landing Page Component
const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">@</span>
              </div>
              <h1 className="text-2xl font-bold text-white">VDart</h1>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => onNavigate('user-status')}
                className="text-white hover:text-blue-200 transition-colors"
              >
                Check Status
              </button>
              <button
                onClick={() => onNavigate('admin-login')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Smart Parking Management
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your parking spot instantly. Get approved by admin. Download your QR pass. Simple and efficient.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 16V10m0 0L8 6m4 4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Book Bike Parking</h3>
              <p className="text-blue-100 mb-6">
                Secure your bike parking spot with our easy booking system
              </p>
              <button
                onClick={() => onNavigate('book-parking', 'bike')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors w-full"
              >
                Book Bike Slot
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Book Car Parking</h3>
              <p className="text-blue-100 mb-6">
                Reserve your car parking space in advance
              </p>
              <button
                onClick={() => onNavigate('book-parking', 'car')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors w-full"
              >
                Book Car Slot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Booking Form Component - SIMPLIFIED VERSION (No availability check)
const BookingForm = ({ vehicleType, onNavigate }) => {
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    phone: '',
    team: '',
    shift: '',
    vehicle_number: '',
    parking_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const requestData = {
        ...formData,
        vehicle_type: vehicleType,
        office_id: "default-office",
        duration_type: "single_day"
      };

      console.log("Submitting parking request:", requestData);
      console.log("API URL:", `${API}/parking-requests`);

      const response = await axios.post(`${API}/parking-requests`, requestData);
      
      console.log("Response received:", response.data);
      
      if (response.data.status === 'waitlist') {
        setMessage('No slots available. You have been added to the waitlist.');
      } else if (response.data.status === 'approved') {
        setMessage(`Parking slot booked successfully! ${response.data.slot_number ? `Your slot number: ${response.data.slot_number}` : ''}`);
      } else {
        setMessage('Parking request submitted successfully! Please wait for admin approval.');
      }
      
      // Reset form but keep some values for convenience
      setFormData({
        emp_id: formData.emp_id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        team: formData.team,
        shift: '',
        vehicle_number: '',
        parking_date: '',
        description: ''
      });

    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setMessage(`Error: ${error.response.status} - ${error.response.data?.detail || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setMessage('Error: No response from server. Please check if backend is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">ParkEase</h1>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Book {vehicleType === 'bike' ? 'Bike' : 'Car'} Parking
              </h2>
              <p className="text-gray-600">
                {vehicleType === 'car' ? '25 slots per shift | 25 slots full day' : '50 slots per shift | 50 slots full day'}
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : message.includes('waitlist')
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your employee ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <input
                    type="text"
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift *
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Shift</option>
                    <option value="morning">Morning (9 AM - 6 PM)</option>
                    <option value="evening">Evening (2 PM - 11 PM)</option>
                    <option value="night">Night (11 PM - 8 AM)</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    required
                    placeholder="e.g., KA01AB1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Date *
                  </label>
                  <input
                    type="date"
                    name="parking_date"
                    value={formData.parking_date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  `Book ${vehicleType === 'car' ? 'Car' : 'Bike'} Parking`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Status Check Component
const UserStatus = ({ onNavigate }) => {
  const [empId, setEmpId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!empId.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.get(`${API}/parking-requests/user/${empId}`);
      setRequests(response.data);
      if (response.data.length === 0) {
        setMessage('No parking requests found for this Employee ID.');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage('No parking requests found for this Employee ID.');
      } else {
        setMessage('Error fetching requests. Please try again.');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      case 'waitlist': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">ParkEase</h1>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Check Request Status</h2>
              <p className="text-gray-600">Enter your Employee ID to view your parking requests</p>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="Enter Employee ID"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </form>

            {message && (
              <div className="text-center text-gray-600 mb-8">
                {message}
              </div>
            )}

            {requests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Parking Requests</h3>
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                        <span className="text-gray-600">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Vehicle:</span> {request.vehicle_type.toUpperCase()} - {request.vehicle_number}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Office:</span> {request.office_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span> {request.parking_date}
                      </div>
                      {request.slot_number && (
                        <div>
                          <span className="font-medium text-gray-700">Slot:</span> {request.slot_number}
                        </div>
                      )}
                    </div>
                    
                    {request.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <span className="font-medium text-red-700">Reason for rejection:</span> {request.rejection_reason}
                      </div>
                    )}
                    
                    {request.description && (
                      <div className="mt-4 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {request.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Login Component
const AdminLogin = ({ onNavigate, onAdminLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      onAdminLogin(response.data);
      onNavigate('admin-dashboard');
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
          <p className="text-blue-100">Access the parking management system</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
              placeholder="admin@parkingsystem.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-200 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-blue-200">
          <p>Demo Credentials:</p>
          <p>admin@parkingsystem.com / admin123</p>
          <p className="mt-1">superadmin@parkingsystem.com / super123</p>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ onNavigate, admin }) => {
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchDashboard();
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchRequests = async (status) => {
    try {
      const response = await axios.get(`${API}/parking-requests?status=${status}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (requestId, status, reason = null) => {
    try {
      await axios.post(`${API}/admin/approve-request`, {
        request_id: requestId,
        status,
        rejection_reason: reason
      });
      
      // Refresh data
      fetchDashboard();
      fetchRequests(activeTab);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      case 'waitlist': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Welcome, {admin?.email}
              </span>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.request_counts.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.request_counts.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.request_counts.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waitlist</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.request_counts.waitlist}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Office Stats */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Office Utilization</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.office_stats.map((office) => (
                <div key={office.office_name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-gray-800 mb-2">{office.office_name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Car Utilization:</span>
                      <span className={`font-medium ${office.car_utilization > 80 ? 'text-red-600' : office.car_utilization > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {office.car_utilization}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bike Utilization:</span>
                      <span className={`font-medium ${office.bike_utilization > 80 ? 'text-red-600' : office.bike_utilization > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {office.bike_utilization}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Car Slots:</span>
                      <span className="font-medium">{office.available_car_slots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Bike Slots:</span>
                      <span className="font-medium">{office.available_bike_slots}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Parking Requests</h3>
          </div>
          
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {['pending', 'approved', 'rejected', 'waitlist'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({dashboard.request_counts[tab]})
                </button>
              ))}
            </nav>
          </div>

          {/* Requests List */}
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No {activeTab} requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                        <span className="text-gray-600">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {request.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleApproveReject(request.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleApproveReject(request.id, 'rejected', reason);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Employee:</span> {request.user_name} ({request.user_email})
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Vehicle:</span> {request.vehicle_type.toUpperCase()} - {request.vehicle_number}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Office:</span> {request.office_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span> {request.parking_date}
                      </div>
                      {request.slot_number && (
                        <div>
                          <span className="font-medium text-gray-700">Slot:</span> {request.slot_number}
                        </div>
                      )}
                    </div>
                    
                    {request.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <span className="font-medium text-red-700">Reason:</span> {request.rejection_reason}
                      </div>
                    )}
                    
                    {request.description && (
                      <div className="mt-4 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {request.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [vehicleType, setVehicleType] = useState('bike');
  const [admin, setAdmin] = useState(null);

  const navigate = (page, vehicleTypeParam = null) => {
    setCurrentPage(page);
    if (vehicleTypeParam) setVehicleType(vehicleTypeParam);
  };

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'book-parking':
        return <BookingForm vehicleType={vehicleType} onNavigate={navigate} />;
      case 'user-status':
        return <UserStatus onNavigate={navigate} />;
      case 'admin-login':
        return <AdminLogin onNavigate={navigate} onAdminLogin={handleAdminLogin} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigate} admin={admin} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;
