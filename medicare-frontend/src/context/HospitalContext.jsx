import { createContext, useContext, useState } from "react";

const HospitalContext = createContext();

export const HospitalProvider = ({ children }) => {
  const [hospitalName, setHospitalName] = useState(localStorage.getItem("hospitalName"));
  const [hospitalId, setHospitalId] = useState(localStorage.getItem("hospitalId"));

  const login = (name, id) => {
    localStorage.setItem("hospitalName", name);
    localStorage.setItem("hospitalId", id);
    setHospitalName(name);
    setHospitalId(id);
  };

  const logout = () => {
    localStorage.removeItem("hospitalName");
    localStorage.removeItem("hospitalId");
    setHospitalName(null);
    setHospitalId(null);
  };

  return (
    <HospitalContext.Provider value={{ hospitalName, hospitalId, login, logout }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
