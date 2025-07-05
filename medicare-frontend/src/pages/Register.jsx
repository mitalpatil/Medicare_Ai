import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useHospital } from "../context/HospitalContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useHospital(); // ✅ use context

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:8000/auth/register", formData);
    login(res.data.name, res.data.hospital_id); // ✅ use context to update
    alert("Hospital Registered!");
    navigate("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Register Hospital</h2>
      {["name", "address", "email", "phone", "password"].map((field) => (
        <input
          key={field}
          type={field === "password" ? "password" : "text"}
          name={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4"
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        />
      ))}
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
        Register
      </button>
    </form>
  );
}
