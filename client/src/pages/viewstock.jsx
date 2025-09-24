import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft, FaEllipsisV, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import "./viewstock.css";


const ViewStock = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    const [stockData] = useState([
        { id: '001', name: 'Rice Bags', quantity: 69, staple: false, expiryDate: '', costPrice: 'K20', sellingPrice: 'K75' },
        { id: '002', name: 'Cooking Oil', quantity: 24, staple: true, expiryDate: '19/09/2026', costPrice: 'K50', sellingPrice: 'K150' },
        { id: '003', name: 'Sugar Packets', quantity: 10, staple: true, expiryDate: '19/09/2026', costPrice: 'K10', sellingPrice: 'K40' },
        { id: '004', name: 'Baking Flour', quantity: 156, staple: true, expiryDate: '', costPrice: 'K3', sellingPrice: 'K10' },
        { id: '005', name: 'Fried Chicken Mix', quantity: 420, staple: true, expiryDate: '19/09/2026', costPrice: 'K25', sellingPrice: 'K75' },
        { id: '006', name: 'Cool Aid', quantity: 32, staple: true, expiryDate: '', costPrice: 'K45', sellingPrice: 'K200' },
        { id: '007', name: 'Watermelon', quantity: 22, staple: true, expiryDate: '19/09/2026', costPrice: 'K15', sellingPrice: 'K50' },
        { id: '008', name: 'Insence', quantity: 19, staple: false, expiryDate: '', costPrice: 'K8', sellingPrice: 'K25' },
        { id: '009', name: 'Shampoo', quantity: 33, staple: true, expiryDate: '15/08/2030', costPrice: 'K12', sellingPrice: 'K35' }
    ]);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const toggleMenu = (index) => {
        setActiveMenu(activeMenu === index ? null : index);
    };

    const handleDelete = (id) => {
        console.log('Delete product:', id);
        setActiveMenu(null);
    };

    const handleEdit = (id) => {
        console.log('Edit product:', id);
        setActiveMenu(null);
    };

    const handleSave = (id) => {
        console.log('Save product:', id);
        setActiveMenu(null);
    };

    const filteredData = stockData.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="viewstockcontainer">
                <div className="viewstockheader">
                    <div className="navtab" onClick={() => navigate('/viewstock')}>
                        <FaWarehouse className="tabicon"/>
                        View Stock
                    </div>
                    <div className="navtab active" onClick={() => navigate('/inputstock')}>
                        <FaTruck className="tabicon"/>
                        Input Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/salesexpiry')}>
                        <FaDollarSign className="tabicon"/>
                        Sales & Expiry
                    </div>
                </div>

                <div className="headeright">
                    <div className="searchcontainer">
                        <input
                            type="text"
                            placeholder="Enter Product ID/Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="searchinput"
                        />
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

            <div className="tablecontainer">
                <table className="stocktable">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Staple</th>
                            <th>Expiry Date</th>
                            <th>Cost Price</th>
                            <th>Selling Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.staple ? 'X' : ''}</td>
                                <td>{item.expiryDate || ''}</td>
                                <td>{item.costPrice}</td>
                                <td>{item.sellingPrice}</td>
                                <td className="actionscell">
                                    <div className="menucontainer">
                                        <button 
                                            className="menubtn"
                                            onClick={() => toggleMenu(index)}
                                        >
                                            <FaEllipsisV />
                                        </button>
                                        {activeMenu === index && (
                                            <div className="actionmenu">
                                                <button 
                                                    className="menuitem delete"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                                <button 
                                                    className="menuitem edit"
                                                    onClick={() => handleEdit(item.id)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button 
                                                    className="menuitem save"
                                                    onClick={() => handleSave(item.id)}
                                                >
                                                    <FaSave /> Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ViewStock;