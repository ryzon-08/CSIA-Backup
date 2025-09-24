import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft, FaClock, FaSearch, FaBox } from 'react-icons/fa';
import './viewexpiry.css';

const ViewExpiry = () => {
    const navigate = useNavigate();
    const [expiryDate, setExpiryDate] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showResults, setShowResults] = useState(false);


    const [stockData] = useState([
        { id: '001', name: 'Rice Bags', quantity: 69, expiryDate: '15/12/2024' },
        { id: '002', name: 'Cooking Oil', quantity: 24, expiryDate: '19/09/2026' },
        { id: '003', name: 'Sugar Packets', quantity: 10, expiryDate: '25/11/2024' },
        { id: '004', name: 'Baking Flour', quantity: 156, expiryDate: '30/10/2024' },
        { id: '005', name: 'Fried Chicken Mix', quantity: 420, expiryDate: '19/09/2026' },
        { id: '006', name: 'Cool Aid', quantity: 32, expiryDate: '05/01/2025' },
        { id: '007', name: 'Watermelon', quantity: 22, expiryDate: '19/09/2026' },
        { id: '008', name: 'Insence', quantity: 19, expiryDate: '12/03/2025' },
        { id: '009', name: 'Shampoo', quantity: 33, expiryDate: '15/08/2030' }
    ]);

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
            if (!product.expiryDate) return false;
            const [day, month, year] = product.expiryDate.split('/');
            const productExpiryDate = new Date(year, month - 1, day);
            
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
        const [day, month, year] = dateStr.split('/');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="view-expiry-container">
            <div className="header">
                <div className="header-content">
                    <div className="nav-items">
                        <div className="nav-item active">
                            <FaClock className="nav-icon" />
                            <span>View Expiry</span>
                        </div>
                        <div className="nav-item" onClick={() => navigate('/inputsales')}>
                            <FaDollarSign className="nav-icon" />
                            <span>Input Sales</span>
                        </div>
                        <div className="nav-item" onClick={() => navigate('/viewsales')}>
                            <FaTruck className="nav-icon" />
                            <span>View Sales</span>
                        </div>
                    </div>
                    <div className="user-section">
                        <div className="user-avatar">
                            <FaUserAlt className="user-icon" />
                        </div>
                        <span className="user-id">User ID</span>
                        <button onClick={handleBack} className="back-button">
                            <FaArrowLeft className="back-icon" />
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
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div key={product.id} className="table-row">
                                        <div className="table-cell">{product.id}</div>
                                        <div className="table-cell">{product.name}</div>
                                        <div className="table-cell">{product.quantity}</div>
                                        <div className="table-cell expiry-date">
                                            {formatDisplayDate(product.expiryDate)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">
                                    <p>No products found expiring on or before {expiryDate}</p>
                                </div>
                            )}
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