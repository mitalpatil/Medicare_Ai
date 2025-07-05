import { Link, useNavigate } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import { Stethoscope, LogOut, Home, LayoutDashboard, UserPlus, LogIn } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { hospitalName, logout } = useHospital();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-800 shadow-md text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 text-2xl font-semibold tracking-wide">
        < Stethoscope size={26} />
        <span>MediCare AI</span>
      </div>

      <div className="flex gap-6 items-center text-sm font-medium">
        <Link to="/" className="hover:text-yellow-300 flex items-center gap-1">
          <Home size={16} /> Home
        </Link>

        {hospitalName ? (
          <>
            <Link to="/dashboard" className="hover:text-yellow-300 flex items-center gap-1">
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">
              {hospitalName}
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-1"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="hover:text-yellow-300 flex items-center gap-1">
              <UserPlus size={16} /> Register
            </Link>
            <Link to="/login" className="hover:text-yellow-300 flex items-center gap-1">
              <LogIn size={16} /> Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
