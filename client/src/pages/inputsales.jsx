import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserAlt, FaArrowLeft, FaMinus, FaPlus } from 'react-icons/fa';
import SalesNavTabs from './components/SalesNavTabs';
import axios from 'axios';
import "./inputsales.css";

const InputSales = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'Guest';
        } catch {
            return 'Guest';
        }
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItems, setCartItems] = useState({});
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch stock data from API
    const fetchStock = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5001/api/stock');
            setStockData(response.data);
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
    const selectedIds = Object.keys(cartItems);
    if (selectedIds.length === 0) {
      alert('No items selected');
      return;
    }

    // Map selected products, filter out any missing records defensively
    const cartData = selectedIds
      .map(productId => {
        const product = stockData.find(item => String(item.product_id) === String(productId));
        if (!product) return null;
        const qty = Number(cartItems[productId] || 0);
        const unit = Number(product.selling_price || 0);
        return {
          product_id: String(productId),
          product_name: String(product.product_name),
          quantity: qty,
          unit_price: unit,
          total_price: qty * unit
        };
      })
      .filter(Boolean);

    if (cartData.length === 0) {
      alert('Selected items are unavailable. Please refresh stock.');
      return;
    }

    const totalAmount = cartData.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const totalItems = selectedIds.reduce((sum, id) => sum + Number(cartItems[id] || 0), 0);

    navigate('/inputsalesbill', { state: { cartItems: cartData, totalAmount, totalItems } });
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
        item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCartItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="input-sales-container">
            <div className="inputsalescontainer">
                <SalesNavTabs />

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
                        <span className="inputsalesuser-id">{getUserId()}</span>
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
                                <th>Selling Price</th>
                                <th>In Cart</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan="5">Loading...</td></tr>
                            )}
                            {error && (
                                <tr><td colSpan="5" style={{color: 'red'}}>{error}</td></tr>
                            )}
                            {!loading && !error && filteredData.map((item, index) => (
                                <tr key={item.product_id}>
                                    <td>{item.product_id}</td>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>K{item.selling_price}</td>
                                    <td className="qtyincart">
                                        <div className="menucontainer">
                                            <button 
                                                className="cartsubtract"
                                                onClick={() => handleRemoveFromCart(item.product_id)}
                                            >
                                                <FaMinus />
                                            </button>
                                            <span className="displayquantity">
                                                {cartItems[item.product_id] || 0}
                                            </span>
                                            <button 
                                                className="cartadd"
                                                onClick={() => handleAddToCart(item.product_id)}
                                                disabled={cartItems[item.product_id] >= item.quantity}
                                            >
                                                <FaPlus />
                                            </button>
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