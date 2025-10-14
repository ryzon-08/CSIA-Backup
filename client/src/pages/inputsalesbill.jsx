import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import "./inputsalesbill.css";

const InputSalesBill = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};
  const cartItems = Array.isArray(navState.cartItems) ? navState.cartItems : [];
  const totalAmount = Number(navState.totalAmount || 0);
  const totalItems = Number(navState.totalItems || 0);
  
  const [saving, setSaving] = useState(false);

  const formatMoney = (val) => `K${Number(val || 0).toFixed(2)}`;

  const handleBack = () => {
    navigate('/inputsales');
  };

  const handleSave = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert('No items to save');
      return;
    }

    setSaving(true);
    try {
      // Generate a unique sale ID
      const saleId = `SALE_${Date.now()}`;
      
      const saleData = {
        sale_id: saleId,
        total_amount: totalAmount,
        total_items: totalItems,
        items: cartItems
      };

      console.log('Saving sale:', saleData);
      
      const response = await axios.post('http://localhost:5001/api/sales', saleData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Sale saved successfully:', response.data);
      alert('Sale saved successfully!');
      
      // Navigate back to input sales with a flag to refresh stock
      navigate('/inputsales', { state: { refreshStock: true } });
      
    } catch (error) {
      console.error('Failed to save sale:', error);
      alert('Failed to save sale: ' + (error?.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this sale?')) {
      navigate('/inputsales');
    }
  };

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="bill-container">
        <div className="bill-header">
          <h1>No items in cart</h1>
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-container">
      <div className="bill-header">
        <h1>Sales Bill</h1>
        <div className="bill-actions">
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>

      <div className="bill-content">
        <div className="bill-items">
          <h2>Items in Bill:</h2>
          <table className="bill-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_price)}</td>
                  <td>{formatMoney(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bill-summary">
          <div className="summary-row">
            <span>Total Items:</span>
            <span>{totalItems}</span>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <span>{formatMoney(totalAmount)}</span>
          </div>
        </div>

        <div className="bill-actions-bottom">
          <button className="cancelbtn" onClick={handleCancel}>
            <FaTimes /> Cancel Sale
          </button>
          <button 
            className="savebtn" 
            onClick={handleSave}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSalesBill;