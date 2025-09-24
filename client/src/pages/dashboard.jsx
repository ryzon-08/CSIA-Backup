import React from 'react';
import { useAuth } from '../context/authcontext.jsx';
import { FaUserAlt } from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";
import { LuBoxes } from "react-icons/lu";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import "./Dashboard.css";
import {useNavigate} from "react-router-dom";


const Dashboard = () => {
    const navigate = useNavigate();

  const { login, logout } = useAuth();

  const handleInputStock = () => {
    navigate('/inputstock');

  };

  const handleViewStock = () => {
    navigate('/viewstock');

  };

  const handleSalesExpiry = () => {
    navigate('/salesexpiry');

  };



return (
    <div className="dashcontainer">
      <div className="dashheader">
        <div className="usersection">
            <div className="userlogo">
                <FaUserAlt />
            </div>
            <span className="user-id">User ID</span>
        </div>
      </div>
    
      <div className="dashmain">
        <h1 className="dashtitle">WHAT WOULD YOU LIKE TO DO TODAY?</h1>

        <div className="interfaces">
            <div className="interface" onClick={handleInputStock}>
                <div className="inputstockicon"><TbTruckDelivery /></div>
                <h3 className="interfacename">Input Stock</h3>
            </div>

            <div className="interface" onClick={handleViewStock}>
                <div className="viewstockicon"><LuBoxes /></div>
                <h3 className="interfacename">View Stock</h3>
            </div>

            <div className="interface" onClick={handleSalesExpiry}>
                <div className="salesexpiryicon"><RiMoneyDollarCircleFill /></div>
                <h3 className="interfacename">Sales & Expiry</h3>
            </div>
        </div>

        <button className="exitbutton" onClick={logout}>Logout</button>
      </div>
    </div>
);
};

export default Dashboard;