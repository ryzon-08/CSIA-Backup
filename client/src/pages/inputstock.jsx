import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft } from 'react-icons/fa';
import "./inputstock.css";

const InputStock = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        quantity: '',
        cost_price: '',
        selling_price: '',
        expiry_date: '',
        staple: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

 const handleSave = () => {
    console.log('Saving Product:', formData);
    alert('Product saved successfully!');
    // Basic validation
    if (!formData.product_id || !formData.product_name || !formData.quantity || !formData.cost_price || !formData.selling_price) {
        alert("Please fill in all required fields.");
        return;
    }
};

    const handleClear = () => {
        setFormData({
            product_id: '',
            product_name: '',
            quantity: '',
            cost_price: '',
            selling_price: '',
            expiry_date: '',
            staple: false
        });
        setError('');
        setSuccess('');
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div>
            <div className="inputstockcontainer">
                <div className="inputstockheader">
                    <div className="navtab active">
                        <FaTruck className="tabicon"/>
                        Input Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/viewstock')}>
                        <FaWarehouse className="tabicon"/>
                        View Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/salesexpiry')}>
                        <FaDollarSign className="tabicon"/>
                        Sales & Expiry
                    </div>
                </div>

                <div className="headeright">
                    <div className="usersection">
                        <div className="userlogo">
                            <FaUserAlt className="usericon" />
                        </div>
                        <span className="user-id">User ID</span>
                    </div>
                    <button className="backbtn" onClick={handleBack}>
                        <FaArrowLeft />
                    </button>
                </div>
            </div>

            <div className="form-container">
                <div className="form-row">
                    <div className="form-group">
                        <label>Product ID:</label>
                        <input
                            type="text"
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Product Name:</label>
                        <input
                            type="text"
                            name="product_name"
                            value={formData.product_name}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Quantity:</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="forminput"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Cost Price:</label>
                        <input
                            type="number"
                            name="cost_price"
                            value={formData.cost_price}
                            onChange={handleInputChange}
                            className="forminput"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Selling Price:</label>
                        <input
                            type="number"
                            name="selling_price"
                            value={formData.selling_price}
                            onChange={handleInputChange}
                            className="forminput"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Expiry Date:</label>
                        <input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleInputChange}
                            className="forminput"
                            disabled={!formData.staple}
                        />
                    </div>
                    
                    <div className="formgroup checkboxgroup">
                        <label className="checkboxlabel">
                            <input
                                type="checkbox"
                                name="staple"
                                checked={formData.staple}
                                onChange={handleInputChange}
                                className="staplecheckbox"
                            />
                            <span className="checkmark"></span>
                            STAPLE
                        </label>
                        <small className="checkboxhint">
                            Check if product has expiry date
                        </small>
                    </div>
                </div>

                <div className="buttonrow">
                    <button className="savebtn" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'SAVE'}
                    </button>
                    <button className="clearbtn" onClick={handleClear}>
                        CLEAR
                    </button>
                </div>

                {error && <div style={{color: 'red', marginTop: '10px'}}>{error}</div>}
                {success && <div style={{color: 'green', marginTop: '10px'}}>{success}</div>}
            </div>
        </div>
    );
};

export default InputStock;