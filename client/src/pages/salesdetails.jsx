import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPrint, FaUserAlt } from 'react-icons/fa';
import axios from 'axios';
import "./salesdetails.css";

const SalesDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale } = location.state || {};
  
  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale && sale.sale_id) {
      fetchSaleDetails(sale.sale_id);
    }
  }, [sale]);

  const fetchSaleDetails = async (saleId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:5001/api/sales/${saleId}`);
      setSaleDetails(response.data);
    } catch (e) {
      console.error('Fetch sale details failed:', e);
      setError('Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/viewsales');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!sale) {
    return (
      <div className="sales-details-container">
        <div className="sales-details-header">
          <h1>Sale Not Found</h1>
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sales-details-container">
        <div className="sales-details-header">
          <h1>Loading Sale Details...</h1>
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-details-container">
        <div className="sales-details-header">
          <h1>Error: {error}</h1>
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-details-container">
      <div className="sales-details-header">
        <h1>Sale Details - {sale?.sale_id || 'Unknown'}</h1>
        <div className="header-actions">
          <button className="printbtn" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="backbtn" onClick={handleBack}>
            ←
          </button>
        </div>
      </div>

      <div className="sales-details-content">
        <div className="bill-info">
          <div className="bill-header-info">
            <h2>Sales Receipt</h2>
            <div className="bill-meta">
              <p><strong>Sale ID:</strong> {sale?.sale_id}</p>
              <p><strong>Date:</strong> {formatDate(sale?.sale_date || sale?.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="bill-items">
          <h3>Items Sold:</h3>
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
              {saleDetails && Array.isArray(saleDetails.items) ? (
                saleDetails.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_id}</td>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>K{Number(item.unit_price || 0).toFixed(2)}</td>
                    <td>K{Number(item.total_price || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bill-summary">
          <div className="summary-row">
            <span>Total Items:</span>
            <span>{Number(sale?.total_items || 0)}</span>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <span>K{Number(sale?.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesDetails;
