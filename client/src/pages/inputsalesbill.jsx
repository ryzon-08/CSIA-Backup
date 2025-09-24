import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft } from 'react-icons/fa';
import "./inputsalesbill.css";

const InputSalesBill = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hi! It's working!</h1>
    </div>
  );
};

export default InputSalesBill;