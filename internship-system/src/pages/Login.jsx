import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    schoolId: "",
    password: "",
    role: "student",
    department: ""
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!loginIdentifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const isEmail = loginIdentifier.includes('@');
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isEmail ? 'email' : 'schoolId']: loginIdentifier,
          password
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        localStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify({
          role: data.role,
          name: data.name,
          email: data.email,
          schoolId: data.schoolId
        }));
        
        navigate(`/${data.role}/dashboard`);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    const { name, password, role, email, schoolId } = registerData;
    
    if (!name || !password || !role) {
      setError("Name, password and role are required");
      return;
    }
    
    if (role === 'student' && !schoolId) {
      setError("School ID is required for students");
      return;
    }
    
    if (role !== 'student' && !email) {
      setError("Email is required for teachers/admins");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
      } else {
        setLoginIdentifier(role === 'student' ? schoolId : email);
        setPassword(password);
        setIsRegistering(false);
        setError("Registration successful! Please login.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert schoolId to uppercase and remove invalid characters
    if (name === 'schoolId') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    
    setRegisterData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left - Image */}
      <div className="hidden md:flex md:w-1/2 relative bg-gray-200">
        <img
          src="https://portal.kitalenationalpolytechnic.ac.ke/uploads/5bed503c-0ea5-4e0d-aab4-5d1a26f3137c.jpg"
          alt="Campus"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1366&q=80";
          }}
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 text-center">
          <h2 className="text-white text-3xl font-bold leading-tight">
            Where skills meet the real world – your journey to industry begins here.
          </h2>
        </div>
      </div>

      {/* Right - Login/Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <img
              src="https://portal.kitalenationalpolytechnic.ac.ke/uploads/635c3616-cea1-4640-aa9b-d8b9a8f6995e.png"
              alt="Logo"
              className="h-20 object-contain mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
            <h1 className="text-2xl font-bold text-red-800 mt-2">
              {isRegistering ? "User Registration" : "Welcome Back"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isRegistering ? "Create your account" : "Please enter your credentials to login"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {registerData.role !== 'admin' && (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={registerData.department}
                    onChange={handleRegisterChange}
                    required={registerData.role !== 'admin'}
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              )}

              {registerData.role === 'student' ? (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    School ID
                  </label>
                  <input
                    type="text"
                    name="schoolId"
                    placeholder="Enter your school ID (e.g., STU123, ABC456)"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={registerData.schoolId}
                    onChange={handleRegisterChange}
                    required={registerData.role === 'student'}
                    pattern="[A-Z0-9]+"
                    title="School ID must contain only uppercase letters and numbers"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use only uppercase letters and numbers (e.g., STU123, ABC456)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required={registerData.role !== 'student'}
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {loginIdentifier.includes('@') ? 'Email' : 'School ID'}
                </label>
                <input
                  type={loginIdentifier.includes('@') ? 'email' : 'text'}
                  placeholder={loginIdentifier.includes('@') ? 'Enter your email' : 'Enter your school ID'}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-600">
            {isRegistering ? (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setIsRegistering(false)}
                  className="text-red-700 hover:underline focus:outline-none"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="text-red-700 hover:underline focus:outline-none"
                >
                  Register
                </button>
              </>
            )}
          </p>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>© 2025 Your Institution. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
