import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft } from 'react-icons/fa';
import "./inputstock.css";

const InputStock = () => {
    const navigate = useNavigate();

    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'admin';
        } catch {
            return 'admin';
        }
    };

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
    const [loadingNextId, setLoadingNextId] = useState(false);

    // Fetch next available product ID
    const fetchNextProductId = async () => {
        setLoadingNextId(true);
        setError(''); // Clear any previous errors
        try {
            console.log('Fetching next product ID...');
            const response = await axios.get('/api/stock/next-id');
            console.log('Next ID response:', response.data);
            setFormData(prev => {
                const newData = {
                    ...prev,
                    product_id: response.data.nextId
                };
                console.log('Setting form data with new product ID:', newData);
                return newData;
            });
        } catch (err) {
            console.error('Failed to fetch next product ID:', err);
            console.error('Error details:', err.response?.data || err.message);
            setError(`Failed to generate product ID: ${err.response?.data?.error || err.message}. Please enter manually.`);
        } finally {
            setLoadingNextId(false);
        }
    };

    // Load next product ID when component mounts
    useEffect(() => {
        fetchNextProductId();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        // Basic validation with specific feedback
        const missing = [];
        if (!formData.product_id) missing.push('Product ID');
        if (!formData.product_name) missing.push('Product Name');
        if (formData.quantity === '') missing.push('Quantity');
        if (formData.cost_price === '') missing.push('Cost Price');
        if (formData.selling_price === '') missing.push('Selling Price');
        if (missing.length) {
            setError(`Missing required fields: ${missing.join(', ')}`);
            return;
        }

        // Validate staple products must have expiry date
        if (formData.staple && (!formData.expiry_date || formData.expiry_date.trim() === '')) {
            setError('Staple products must have an expiry date. Please enter an expiry date or uncheck the staple option.');
            return;
        }

        const payload = {
            product_id: String(formData.product_id),
            product_name: String(formData.product_name),
            quantity: Number(formData.quantity),
            cost_price: Number(formData.cost_price),
            selling_price: Number(formData.selling_price),
            expiry_date: formData.expiry_date || null,
            staple: !!formData.staple,
        };

        setLoading(true);
        try {
            await axios.post('/api/stock', payload, { headers: { 'Content-Type': 'application/json' } });
            setSuccess('Product saved successfully!');
            // Reset form but keep the next auto-generated product ID
            const currentProductId = formData.product_id;
            setFormData({
                product_id: currentProductId,
                product_name: '',
                quantity: '',
                cost_price: '',
                selling_price: '',
                expiry_date: '',
                staple: false
            });
            // Fetch the next product ID for the next entry
            fetchNextProductId();
        } catch (err) {
            const msg = err?.response?.data?.error || 'Error saving product. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
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
        // Fetch a new product ID after clearing
        fetchNextProductId();
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
                        <span className="user-id">{getUserId()}</span>
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
                            placeholder={loadingNextId ? "Generating..." : "Auto-generated"}
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