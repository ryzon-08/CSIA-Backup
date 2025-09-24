import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft, FaEllipsisV, FaTrash, FaEdit, FaSave, FaMinus, FaPlus } from 'react-icons/fa';
import "./inputsales.css";

const InputSales = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);
    const [cartItems, setCartItems] = useState({});

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

    // Determine which tab is active based on current route
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/viewstock')) return 'viewstock';
        if (path.includes('/inputstock') || path.includes('/inputsales')) return 'inputstock';
        if (path.includes('/salesexpiry')) return 'salesexpiry';
        return 'inputstock'; // default
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleProceedToBill = () => {
        navigate('/inputsalesbill');
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

    const handleAddToCart = (productId) => {
        setCartItems(prev => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1
        }));
    };

    const handleRemoveFromCart = (productId) => {
        setCartItems(prev => {
            const newCart = { ...prev };
            if (newCart[productId] > 0) {
                newCart[productId] -= 1;
                if (newCart[productId] === 0) {
                    delete newCart[productId];
                }
            }
            return newCart;
        });
    };

    const handleClear = () => {
        setCartItems({});
    };

    const filteredData = stockData.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCartItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="input-sales-container">
            <div className="inputsalescontainer">
                <div className="inputsalesheader">
                    <div 
                        className={`inputsalesnavtab ${getActiveTab() === 'viewstock' ? 'active' : ''}`}
                        onClick={() => navigate('/viewstock')}
                    >
                        <FaWarehouse className="tabicon"/>
                        View Stock
                    </div>
                    <div 
                        className={`inputsalesnavtab ${getActiveTab() === 'inputstock' ? 'active' : ''}`}
                        onClick={() => navigate('/inputsales')}
                    >
                        <FaTruck className="tabicon"/>
                        Input Sales
                    </div>
                    <div 
                        className={`inputsalesnavtab ${getActiveTab() === 'salesexpiry' ? 'active' : ''}`}
                        onClick={() => navigate('/salesexpiry')}
                    >
                        <FaDollarSign className="inputsalestabicon"/>
                        Sales & Expiry
                    </div>
                </div>

                <div className="inputsalesheaderight">
                    <div className="inputsalessearchcontainer">
                        <input
                            type="text"
                            placeholder="Enter Product ID/Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="inputsalessearchinput"
                        />
                    </div>
                    <div className="inputsalesusersection">
                        <div className="inputsalesuserlogo">
                            <FaUserAlt className="inputsalesusericon" />
                        </div>
                        <span className="inputsalesuser-id">User ID</span>
                    </div>
                    <button className="backbtn" onClick={handleBack}>
                        <FaArrowLeft />
                    </button>
                </div>
            </div>

            <div className="saleslayout">
                <div className="tablecontainer">
                    <table className="salestable">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Qty In Stock</th>
                                <th>In Cart</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td className="qtyincart">
                                        <div className="menucontainer">
                                            <button 
                                                className="cartsubtract"
                                                onClick={() => handleRemoveFromCart(item.id)}
                                                disabled={!cartItems[item.id]}
                                            >
                                                <FaMinus />
                                            </button>
                                            <span className="displayquantity">
                                                {cartItems[item.id] || 0}
                                            </span>
                                            <button 
                                                className="cartadd"
                                                onClick={() => handleAddToCart(item.id)}
                                                disabled={cartItems[item.id] >= item.quantity}
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                    </td>
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

                <div className="sidebar">
                    <div className="cartinfo">
                        <div className="carttotal">
                            Total Items: {totalCartItems}
                        </div>
                    </div>

                    <div className="actionbuttons">
                        <button className="clearbtn" onClick={handleClear}>
                            CLEAR
                        </button>
                        <button className="proceedbtn" onClick={handleProceedToBill}>
                            Proceed To Bill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputSales;