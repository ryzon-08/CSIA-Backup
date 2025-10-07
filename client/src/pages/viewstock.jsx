import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft, FaEllipsisV, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import axios from 'axios';
import "./viewstock.css";


const ViewStock = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editRowIndex, setEditRowIndex] = useState(null);
    const [originalProductId, setOriginalProductId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({});

    const fetchStock = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5001/api/stock');
            setStockData(res.data);
        } catch (e) {
            setError('Failed to load stock');
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

    const toggleMenu = (index) => {
        setActiveMenu(activeMenu === index ? null : index);
    };

    const handleDelete = async (rowKey) => {
        setActiveMenu(null);
        const ok = window.confirm('Are you sure you want to delete this product?');
        if (!ok) return;
        try {
            const key = rowKey ?? null;
            console.log('Attempting to delete with key:', key, 'Type:', typeof key);
            if (!key) throw new Error('Missing identifier');
            
            const response = await axios.delete(`http://localhost:5001/api/stock/${key}`);
            console.log('Delete response:', response);
            setStockData(prev => prev.filter(item => item.product_id !== key));
        } catch (e) {
            console.error('Delete error:', e);
            alert('Failed to delete: ' + (e?.response?.data?.error || e.message));
        }
    };

    const handleEdit = (rowKey) => {
        setActiveMenu(null);
        const rowIndex = stockData.findIndex(x => x.product_id === rowKey);
        setEditRowIndex(rowIndex);
        setOriginalProductId(rowKey); // Store the original product_id
        setIsEditing(true);
        // Initialize draft with the selected row's data
        const row = stockData[rowIndex];
        if (!row) {
            alert('Product not found');
            return;
        }
        setDraft({
            product_id: row.product_id ?? row.id,
            product_name: row.product_name ?? row.name,
            quantity: row.quantity,
            staple: !!row.staple,
            expiry_date: row.expiry_date ? String(row.expiry_date).substring(0,10) : '',
            cost_price: row.cost_price ?? '',
            selling_price: row.selling_price ?? '',
        });
    };

    const handleSave = async () => {
        setActiveMenu(null);
        try {
            console.log('Looking for editRowIndex:', editRowIndex);
            console.log('Available items:', stockData.map(item => item.product_id));
            
            // Find the item being edited by index
            const itemToSave = stockData[editRowIndex];
            console.log('Found item:', itemToSave);
            
            if (!itemToSave) {
                alert('Item not found. EditRowIndex: ' + editRowIndex);
                return;
            }

            // Validate: Check ALL staple items in the list for expiry dates
            const invalidStapleItems = stockData.filter(item => 
                item.staple && (!item.expiry_date || item.expiry_date.trim() === '')
            );
            
            if (invalidStapleItems.length > 0) {
                alert(`Please enter expiry date for all staple items. Found ${invalidStapleItems.length} staple item(s) without expiry date.`);
                return;
            }

            const payload = {
                product_id: String(itemToSave.product_id),
                product_name: String(itemToSave.product_name),
                quantity: Number(itemToSave.quantity),
                cost_price: Number(itemToSave.cost_price),
                selling_price: Number(itemToSave.selling_price),
                staple: !!itemToSave.staple,
                expiry_date: itemToSave.expiry_date || null,
            };

            console.log('Saving item:', itemToSave.product_id, 'with payload:', payload);
            
            console.log('Using original product_id for API call:', originalProductId);
            
            const response = await axios.put(`http://localhost:5001/api/stock/${originalProductId}`, payload, { 
                headers: { 'Content-Type': 'application/json' } 
            });
            
            console.log('Save response:', response.data);
            
            // Update the local state with the response
            setStockData(prev => prev.map(item => 
                item.product_id === itemToSave.product_id ? response.data : item
            ));
            
            setEditRowIndex(null);
            setOriginalProductId(null);
            setDraft({});
            setIsEditing(false);
        } catch (e) {
            console.error('Save error:', e);
            console.error('Error response:', e?.response?.data);
            console.error('Error status:', e?.response?.status);
            console.error('Error message:', e?.message);
            alert('Failed to save: ' + (e?.response?.data?.error || e?.message || 'Unknown error'));
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditRowIndex(null);
        setOriginalProductId(null);
        setDraft({});
        fetchStock(); // Reload to get fresh data
    };

    const norm = v => (v ?? '').toString().toLowerCase();
    const filteredData = stockData.filter(item => 
        norm(item.product_id ?? item.id).includes(searchTerm.toLowerCase()) || 
        norm(item.product_name ?? item.name).includes(searchTerm.toLowerCase())
    );

    return (
        <div onClick={(e) => {
            // Cancel edit if clicking outside table
            if (isEditing && !e.target.closest('.tablecontainer')) {
                cancelEdit();
            }
        }}>
            <div className="viewstockcontainer">
                <div className="viewstockheader">
                    <div className="navtab active" onClick={() => navigate('/viewstock')}>
                        <FaWarehouse className="tabicon"/>
                        View Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/inputstock')}>
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
                        {loading && (
                            <tr><td colSpan="8">Loading...</td></tr>
                        )}
                        {!loading && filteredData.map((item, index) => (
                            <tr key={`row_${index}`}>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`product_id_input_${index}`}
                                            className="tableinput" 
                                            value={item.product_id} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                newData[index].product_id = e.target.value;
                                                setStockData(newData);
                                            }}
                                            onKeyDown={e => e.stopPropagation()}
                                            onFocus={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        item.product_id
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`product_name_input_${index}`}
                                            className="tableinput" 
                                            value={item.product_name ?? item.name} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                newData[index].product_name = e.target.value;
                                                setStockData(newData);
                                            }}
                                            onKeyDown={e => e.stopPropagation()}
                                            onFocus={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        item.product_name ?? item.name
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`quantity_input_${index}`}
                                            type="number" 
                                            className="tableinput" 
                                            value={item.quantity} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                newData[index].quantity = Number(e.target.value);
                                                setStockData(newData);
                                            }}
                                            onKeyDown={e => e.stopPropagation()}
                                            onFocus={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        item.quantity
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input type="checkbox" checked={!!item.staple} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].staple = e.target.checked;
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.staple ? 'X' : ''
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        item.staple ? (
                                            <input 
                                                key={`expiry_date_input_${index}`}
                                                type="date" 
                                                className="tableinput" 
                                                value={item.expiry_date ? String(item.expiry_date).substring(0,10) : ''} 
                                                onChange={e => {
                                                    const newData = [...stockData];
                                                    newData[index].expiry_date = e.target.value;
                                                    setStockData(newData);
                                                }}
                                                onKeyDown={e => e.stopPropagation()}
                                                onFocus={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span style={{ color: '#999', fontStyle: 'italic' }}>Not a staple item</span>
                                        )
                                    ) : (
                                        item.expiry_date ? String(item.expiry_date).substring(0,10) : ''
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`cost_price_input_${index}`}
                                            type="number" 
                                            step="0.01" 
                                            className="tableinput" 
                                            value={item.cost_price} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                newData[index].cost_price = Number(e.target.value);
                                                setStockData(newData);
                                            }}
                                            onKeyDown={e => e.stopPropagation()}
                                            onFocus={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        item.cost_price
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`selling_price_input_${index}`}
                                            type="number" 
                                            step="0.01" 
                                            className="tableinput" 
                                            value={item.selling_price} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                newData[index].selling_price = Number(e.target.value);
                                                setStockData(newData);
                                            }}
                                            onKeyDown={e => e.stopPropagation()}
                                            onFocus={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        item.selling_price
                                    )}
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
                                                    onClick={() => handleDelete(item.product_id)}
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                                <button 
                                                    className="menuitem edit"
                                                    onClick={() => handleEdit(item.product_id)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                {/* Save button removed from menu */}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isEditing && (
                    <div style={{marginTop: '12px', display: 'flex', gap: '8px'}}>
                        <button className="savebtn" onClick={handleSave}>Save All Changes</button>
                        <button className="clearbtn" onClick={cancelEdit}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewStock;