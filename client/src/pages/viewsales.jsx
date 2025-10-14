import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaFilter } from 'react-icons/fa';
import SalesNavTabs from './components/SalesNavTabs';
import axios from 'axios';
import "./viewsales.css";

const ViewSales = () => {
    const navigate = useNavigate();
    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'admin';
        } catch {
            return 'admin';
        }
    };
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('Current Day');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch sales data from API
    const fetchSales = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5001/api/sales');
            const rows = Array.isArray(response.data) ? response.data : [];
            setSalesData(rows);
        } catch (e) {
            console.error('Fetch sales failed:', e);
            setError('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const filterOptions = ['Last 24h', 'Last 7 days', 'Last 30 days', 'This Year', 'All'];

    const handleBack = () => {
        navigate('/dashboard');
    };

    const toggleFilter = () => {
        setFilterOpen(!filterOpen);
    };

    const handleFilterSelect = (option) => {
        setSelectedFilter(option);
        setFilterOpen(false);
        fetchSales();
    };

    const isWithinFilter = (isoDate) => {
        const d = isoDate ? new Date(isoDate) : new Date();
        const now = new Date();
        switch (selectedFilter) {
            case 'Last 24h':
                return now.getTime() - d.getTime() <= 24*60*60*1000;
            case 'Last 7 days':
                return now.getTime() - d.getTime() <= 7*24*60*60*1000;
            case 'Last 30 days':
                return now.getTime() - d.getTime() <= 30*24*60*60*1000;
            case 'This Year':
                return d.getFullYear() === now.getFullYear();
            case 'All':
            default:
                return true;
        }
    };

    const handleRecordSelect = (sale) => {
        // Navigate to sales details page with sale data
        navigate('/salesdetails', { 
            state: { 
                sale: sale
            } 
        });
    };

    const formatDate = (dateString) => {
        const src = dateString || null;
        const date = src ? new Date(src) : new Date();
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div>
            <div className="viewsalescontainer">
                <SalesNavTabs />

                <div className="headeright">
                    <div className="filtercontainer">
                        <button className="filterbtn" onClick={toggleFilter}>
                            <FaFilter className="filtericon" />
                            Filter
                        </button>
                        {filterOpen && (
                            <div className="filterdropdown">
                                {filterOptions.map((option, index) => (
                                    <button 
                                        key={index}
                                        className={`filteroption ${selectedFilter === option ? 'active' : ''}`}
                                        onClick={() => handleFilterSelect(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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

            <div className="contentwrapper">
                <div className="sectiontitle">
                    <h2>Previous Sales:</h2>
                </div>

                <div className="tablecontainer">
                    <div className="table-scroll-wrapper">
                        <table className="salestable">
                        <thead>
                            <tr>
                                <th>Date Sold:</th>
                                <th>No. of Items</th>
                                <th>Total Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan="3">Loading...</td></tr>
                            )}
                            {error && (
                                <tr><td colSpan="3" style={{color: 'red'}}>{error}</td></tr>
                            )}
                            {!loading && !error && salesData.length === 0 && (
                                <tr><td colSpan="3">No sales yet</td></tr>
                            )}
                            {!loading && !error && salesData
                              .filter(s => isWithinFilter(s.sale_date || s.created_at))
                              .map((sale, index) => (
                                <tr 
                                    key={sale.sale_id || index}
                                    className={selectedRecord === index ? 'selected' : ''}
                                    onClick={() => handleRecordSelect(sale)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{formatDate(sale.sale_date || sale.created_at)}</td>
                                    <td>{Number(sale.total_items || 0)}</td>
                                    <td>K{Number(sale.total_amount || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSales;