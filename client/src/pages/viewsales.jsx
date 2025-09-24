import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartBar, FaDollarSign, FaClock, FaUserAlt, FaArrowLeft, FaFilter } from 'react-icons/fa';
import "./viewsales.css";

const ViewSales = () => {
    const navigate = useNavigate();
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('Current Day');
    const [selectedRecord, setSelectedRecord] = useState(null);

    const [salesData] = useState([
        { date: '15/08/2024', items: 12, total: 'K2,500' },
        { date: '14/08/2024', items: 8, total: 'K1,850' },
        { date: '13/08/2024', items: 15, total: 'K3,200' },
        { date: '12/08/2024', items: 6, total: 'K1,100' },
        { date: '11/08/2024', items: 20, total: 'K4,750' },
        { date: '10/08/2024', items: 9, total: 'K2,100' },
        { date: '09/08/2024', items: 11, total: 'K2,800' },
        { date: '08/08/2024', items: 7, total: 'K1,650' }
    ]);

    const filterOptions = ['Current Day', 'Weekly', 'Monthly', 'Yearly'];

    const handleBack = () => {
        navigate('/dashboard');
    };

    const toggleFilter = () => {
        setFilterOpen(!filterOpen);
    };

    const handleFilterSelect = (option) => {
        setSelectedFilter(option);
        setFilterOpen(false);
    };

    const handleRecordSelect = (index) => {
        setSelectedRecord(index === selectedRecord ? null : index);
    };

    return (
        <div>
            <div className="viewsalescontainer">
                <div className="viewsalesheader">
                    <div className="navtab active" onClick={() => navigate('/viewsales')}>
                        <FaChartBar className="tabicon"/>
                        View Sales
                    </div>
                    <div className="navtab" onClick={() => navigate('/inputsales')}>
                        <FaDollarSign className="tabicon"/>
                        Input Sales
                    </div>
                    <div className="navtab" onClick={() => navigate('/viewexpiry')}>
                        <FaClock className="tabicon"/>
                        View Expiry
                    </div>
                </div>

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
                        <span className="user-id">User ID</span>
                    </div>
                    <button className="backbtn" onClick={handleBack}>
                        <FaArrowLeft />
                    </button>
                </div>
            </div>

            <div className="contentwrapper">
                <div className="sectiontitle">
                    <h2>Previous Sales:</h2>
                </div>

                <div className="tablecontainer">
                    <table className="salestable">
                        <thead>
                            <tr>
                                <th>Date Sold:</th>
                                <th>No. of Items</th>
                                <th>Total Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData.map((sale, index) => (
                                <tr 
                                    key={index}
                                    className={selectedRecord === index ? 'selected' : ''}
                                    onClick={() => handleRecordSelect(index)}
                                >
                                    <td>{sale.date}</td>
                                    <td>{sale.items}</td>
                                    <td>{sale.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ViewSales;