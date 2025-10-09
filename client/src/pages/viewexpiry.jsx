import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaArrowLeft, FaSearch, FaBox, FaClock } from 'react-icons/fa';
import SalesNavTabs from './components/SalesNavTabs';
import axios from 'axios';
import './viewexpiry.css';

const ViewExpiry = () => {
    const navigate = useNavigate();
    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'Guest';
        } catch {
            return 'Guest';
        }
    };
    const [expiryDate, setExpiryDate] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch stock data from API
    const fetchStock = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5001/api/stock');
            // Filter only staple items
            const stapleItems = response.data.filter(item => item.staple);
            setStockData(stapleItems);
        } catch (e) {
            console.error('Fetch stock failed:', e);
            setError('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleSearch = () => {
        if (!expiryDate) {
            alert('Please enter an expiry date');
            return;
        }

        const searchDate = new Date(expiryDate);

        const filtered = stockData.filter(product => {
            if (!product.expiry_date) return false;
            const productExpiryDate = new Date(product.expiry_date);
            
            return productExpiryDate <= searchDate;
        });

        setFilteredProducts(filtered);
        setShowResults(true);
    };

    const handleDateChange = (e) => {
        setExpiryDate(e.target.value);
        setShowResults(false);
        setFilteredProducts([]);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="view-expiry-container">
            <div className="viewstockcontainer">
                <div className="viewstockheader">
                    <SalesNavTabs />
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
            </div>


            <div className="main-content">

                <div className="search-section">
                    <div className="search-container">
                        <label className="search-label">Enter Expiry Date:</label>
                        <input
                            type="date"
                            className="date-input"
                            value={expiryDate}
                            onChange={handleDateChange}
                        />
                        <button onClick={handleSearch} className="search-button">
                            <FaSearch className="search-icon" />
                            Search
                        </button>
                    </div>
                    <p className="search-description">
                        User enters expiry date first then products are displayed
                    </p>
                </div>

                {!showResults && (
                    <div className="search-display">
                        <div className="search-icon-container">
                            <FaSearch className="large-search-icon" />
                            <FaBox className="box-icon" />
                        </div>
                        <p className="search-text">Enter a date above to search for expiring products</p>
                    </div>
                )}


                {showResults && (
                    <div className="results-section">
                        <div className="table-header">
                            <div>Product ID</div>
                            <div>Product Name</div>
                            <div>Qty in Stock</div>
                            <div>Expiry Date:</div>
                        </div>

                        <div className="table-body">
                            {loading && (
                                <div className="no-results">
                                    <p>Loading...</p>
                                </div>
                            )}
                            {error && (
                                <div className="no-results">
                                    <p style={{color: 'red'}}>{error}</p>
                                </div>
                            )}
                            {!loading && !error && filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div key={product.product_id} className="table-row">
                                        <div className="table-cell">{product.product_id}</div>
                                        <div className="table-cell">{product.product_name}</div>
                                        <div className="table-cell">{product.quantity}</div>
                                        <div className="table-cell expiry-date">
                                            {formatDisplayDate(product.expiry_date)}
                                        </div>
                                    </div>
                                ))
                            ) : !loading && !error ? (
                                <div className="no-results">
                                    <p>No products found expiring on or before {expiryDate}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}


                <div className="hourglass-container">
                    <FaClock className="hourglass-icon" />
                </div>
            </div>
        </div>
    );
};

export default ViewExpiry;