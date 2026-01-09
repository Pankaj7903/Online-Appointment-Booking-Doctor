import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const currencySymbol = '$';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userData, setUserData] = useState(null);

  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
      if (data.success) setDoctors(data.doctors);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadUserProfileData = async () => {
    if (!token) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) setUserData(data.userData);
      else toast.error(data.message);
    } catch (error) {
      logout();
    }
  };

  const logout = () => {
    setToken('');
    setUserData(null);
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) loadUserProfileData();
    else setUserData(null);
  }, [token]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  return (
    <AppContext.Provider value={{
      doctors,
      getDoctorsData,
      currencySymbol,
      token,
      setToken,
      backendUrl,
      userData,
      setUserData,
      loadUserProfileData,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
