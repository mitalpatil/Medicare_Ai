import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login } = useHospital(); // ✅ Get login function from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/auth/login', credentials);
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token); // optional
        login(res.data.name , res.data.hospital_id); // ✅ this updates context + triggers navbar re-render
        alert("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      alert("Login failed. Please check credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Hospital Login</h2>
      <input
        type="email"
        placeholder="Email"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4"
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4"
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
      />
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
        Login
      </button>
    </form>
  );
}
