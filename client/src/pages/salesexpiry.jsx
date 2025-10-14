import React from 'react';
import { useAuth } from '../context/authcontext.jsx';
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { AiOutlineStock } from "react-icons/ai";
import { FaUserAlt } from "react-icons/fa";
import { FaHourglassHalf } from "react-icons/fa";
import {useNavigate} from "react-router-dom";
import "./salesexpiry.css";


const SalesDashboard = () => {
    const navigate = useNavigate();

  const { login, logout } = useAuth();

  const handleInputSales = () => {
    navigate('/inputsales');

  };

  const handleViewSales = () => {
    navigate('/viewsales');

  };

  const handleViewExpiry = () => {
    navigate('/viewexpiry');


  };

  const handleBack = () => {
    navigate('/dashboard');
  };

   



return (
    <div className="salesdashcontainer">
      <button className="backbtn" onClick={handleBack}>
          ←
        </button>
      <div className="salesdashheader">
        <div className="salesusersection">
            <div className="salesuserlogo">
                <FaUserAlt />
            </div>
            <span className="user-id">admin</span>
        </div>
      </div>
    
      <div className="salesdashmain">
        <h1 className="salesdashtitle">WHAT WOULD YOU LIKE TO DO?</h1>

        <div className="interfaces">
            <div className="interface" onClick={handleInputSales}>
                <div className="inputsalesicon"><FaMoneyBillTrendUp /></div>
                <h3 className="interfacename">Input Sales</h3>
            </div>

            <div className="interface" onClick={handleViewSales}>
                <div className="viewsalesicon"><AiOutlineStock /></div>
                <h3 className="interfacename">View Sales</h3>
            </div>

            <div className="interface" onClick={handleViewExpiry}>
                <div className="viewexpiryicon"><FaHourglassHalf /></div>
                <h3 className="interfacename">View Expiry</h3>
            </div>
        </div>

        <button className="exitbutton" onClick={logout}>Logout</button>
      </div>
    </div>
);
};

export default SalesDashboard;