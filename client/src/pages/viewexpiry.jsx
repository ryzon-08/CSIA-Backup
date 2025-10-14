import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaSearch, FaBox, FaClock, FaTimes } from 'react-icons/fa';
import SalesNavTabs from './components/SalesNavTabs';
import axios from 'axios';
import './viewexpiry.css';

const ViewExpiry = () => {
    const navigate = useNavigate();
    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'admin';
        } catch {
            return 'admin';
        }
    };
    const [expiryDate, setExpiryDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showResults, setShowResults] = useState(true); // Show results by default
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Fetch stock data from API
    const fetchStock = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5001/api/stock');
            // Filter only staple items and sort by expiry date (earliest first)
            const stapleItems = response.data
                .filter(item => item.staple)
                .sort((a, b) => {
                    if (!a.expiry_date && !b.expiry_date) return 0;
                    if (!a.expiry_date) return 1; // Items without expiry date go to end
                    if (!b.expiry_date) return -1;
                    return new Date(a.expiry_date) - new Date(b.expiry_date);
                });
            setStockData(stapleItems);
            setFilteredProducts(stapleItems); // Set default display
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
        if (!expiryDate && !searchTerm.trim()) {
            alert('Please enter either an expiry date or search for a product');
            return;
        }

        let filtered = [...stockData];

        // Apply expiry date filter if provided
        if (expiryDate) {
            const searchDate = new Date(expiryDate);
            filtered = filtered.filter(product => {
                if (!product.expiry_date) return false;
                const productExpiryDate = new Date(product.expiry_date);
                return productExpiryDate <= searchDate;
            });
        }

        // Apply search term filter if provided
        if (searchTerm.trim()) {
            filtered = filtered.filter(product => 
                product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
        setShowResults(true);
        setIsSearchActive(true);
    };

    const handleDateChange = (e) => {
        setExpiryDate(e.target.value);
    };

    const handleCancelSearch = () => {
        setExpiryDate('');
        setSearchTerm('');
        setIsSearchActive(false);
        // Reset to show all staple products sorted by expiry date
        const sortedStapleItems = [...stockData].sort((a, b) => {
            if (!a.expiry_date && !b.expiry_date) return 0;
            if (!a.expiry_date) return 1;
            if (!b.expiry_date) return -1;
            return new Date(a.expiry_date) - new Date(b.expiry_date);
        });
        setFilteredProducts(sortedStapleItems);
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
            <div className="viewexpirycontainer">
                <SalesNavTabs />

                <div className="headeright">
                    <div className="usersection">
                        <div className="userlogo">
                            <FaUserAlt className="usericon" />
                        </div>
                        <span className="user-id">{getUserId()}</span>
                    </div>
                    <button className="backbtn" onClick={handleBack}>
                        ←
                    </button>
                </div>
            </div>


            <div className="main-content">

                <div className="search-section">
                    <div className="search-container">
                        <label className="search-label">Enter Expiry Date (optional):</label>
                        <input
                            type="date"
                            className="date-input"
                            value={expiryDate}
                            onChange={handleDateChange}
                            placeholder="Optional"
                        />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Product ID or Name (optional)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={handleSearch} className="search-button">
                            <FaSearch className="search-icon" />
                            Search
                        </button>
                        {isSearchActive && (
                            <button onClick={handleCancelSearch} className="cancel-button">
                                <FaTimes className="cancel-icon" />
                                Cancel
                            </button>
                        )}
                    </div>
                    <p className="search-description">
                        Search by expiry date, product ID/name, or both
                    </p>
                </div>

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


            </div>
        </div>
    );
};

export default ViewExpiry;