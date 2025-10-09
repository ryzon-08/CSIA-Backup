import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft, FaEllipsisV, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import axios from 'axios';
import "./viewstock.css";


const ViewStock = () => {
    const navigate = useNavigate();
    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'Guest';
        } catch {
            return 'Guest';
        }
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [modifiedItems, setModifiedItems] = useState(new Set());

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

    const isMenuNearBottom = (index) => {
        // Show menu above if it's one of the last 2 rows
        return index >= sortedData.length - 2;
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
        setIsEditing(true);
        // Mark this item as potentially modified (so user knows they can edit it)
        console.log('Edit mode enabled for table');
    };

    const handleSave = async () => {
        setActiveMenu(null);
        try {
            // Validate: Check ALL staple items in the list for expiry dates
            const invalidStapleItems = stockData.filter(item => 
                item.staple && (!item.expiry_date || item.expiry_date.trim() === '')
            );
            
            if (invalidStapleItems.length > 0) {
                alert(`Please enter expiry date for all staple items. Found ${invalidStapleItems.length} staple item(s) without expiry date.`);
                return;
            }

            // Get all modified items
            console.log('Modified items set:', Array.from(modifiedItems));
            console.log('Stock data product IDs:', stockData.map(item => item.product_id));
            
            const itemsToSave = stockData.filter(item => modifiedItems.has(item.product_id));
            
            console.log('Items to save:', itemsToSave.length);
            
            if (itemsToSave.length === 0) {
                alert('No changes to save. Make sure you are in edit mode and have modified some fields.');
                return;
            }

            console.log('Saving', itemsToSave.length, 'modified items');

            // Save all modified items
            const savePromises = itemsToSave.map(async (item) => {
                const payload = {
                    product_id: String(item.product_id),
                    product_name: String(item.product_name),
                    quantity: Number(item.quantity),
                    cost_price: Number(item.cost_price),
                    selling_price: Number(item.selling_price),
                    staple: !!item.staple,
                    expiry_date: item.expiry_date ? String(item.expiry_date).substring(0, 10) : null,
                };

                console.log('Saving item:', item.product_id, 'with payload:', payload);
                
                return axios.put(`http://localhost:5001/api/stock/${item.product_id}`, payload, { 
                    headers: { 'Content-Type': 'application/json' } 
                });
            });

            await Promise.all(savePromises);
            
            console.log('All items saved successfully');
            
            // Clear modified items and exit edit mode
            setModifiedItems(new Set());
            setIsEditing(false);
            
            // Refresh data from server
            await fetchStock();
            
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
        setModifiedItems(new Set());
        fetchStock(); // Reload to get fresh data
    };

    const norm = v => (v ?? '').toString().toLowerCase();
    const filteredData = stockData.filter(item => 
        norm(item.product_id ?? item.id).includes(searchTerm.toLowerCase()) || 
        norm(item.product_name ?? item.name).includes(searchTerm.toLowerCase())
    );

    // Ensure consistent ordering by product_id (numeric when possible)
    const byProductId = (a, b) => {
        const A = a.product_id ?? a.id ?? '';
        const B = b.product_id ?? b.id ?? '';
        const an = Number(A);
        const bn = Number(B);
        const aIsNum = !Number.isNaN(an) && String(A).trim() !== '';
        const bIsNum = !Number.isNaN(bn) && String(B).trim() !== '';
        if (aIsNum && bIsNum) return an - bn;
        return String(A).localeCompare(String(B), undefined, { numeric: true, sensitivity: 'base' });
    };
    const sortedData = [...filteredData].sort(byProductId);

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
                        <span className="user-id">{getUserId()}</span>
                    </div>
                    <button className="backbtn" onClick={handleBack}>
                        <FaArrowLeft />
                    </button>
                </div>
            </div>

            <div className="tablecontainer">
                <div className="table-scroll-wrapper">
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
                        {!loading && sortedData.map((item, index) => (
                            <tr key={`row_${index}`}>
                                <td>
                                    {isEditing ? (
                                        <input 
                                            key={`product_id_input_${index}`}
                                            className="tableinput" 
                                            value={item.product_id} 
                                            onChange={e => {
                                                const newData = [...stockData];
                                                const key = item.product_id;
                                                const i = newData.findIndex(x => x.product_id === key);
                                                if (i !== -1) {
                                                    newData[i].product_id = e.target.value;
                                                    setStockData(newData);
                                                    setModifiedItems(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(key);
                                                        console.log('Added to modified items:', key, 'Set now has:', Array.from(newSet));
                                                        return newSet;
                                                    });
                                                }
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
                                                const key = item.product_id;
                                                const i = newData.findIndex(x => x.product_id === key);
                                                if (i !== -1) {
                                                    newData[i].product_name = e.target.value;
                                                    setStockData(newData);
                                                    setModifiedItems(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(key);
                                                        return newSet;
                                                    });
                                                }
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
                                                const key = item.product_id;
                                                const i = newData.findIndex(x => x.product_id === key);
                                                if (i !== -1) {
                                                    newData[i].quantity = Number(e.target.value);
                                                    setStockData(newData);
                                                    setModifiedItems(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(key);
                                                        return newSet;
                                                    });
                                                }
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
                                            const key = item.product_id;
                                            const index = newData.findIndex(x => x.product_id === key);
                                            if (index !== -1) {
                                                newData[index].staple = e.target.checked;
                                                setStockData(newData);
                                                setModifiedItems(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.add(key);
                                                    return newSet;
                                                });
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
                                                    const key = item.product_id;
                                                    const i = newData.findIndex(x => x.product_id === key);
                                                    if (i !== -1) {
                                                        newData[i].expiry_date = e.target.value;
                                                        setStockData(newData);
                                                        setModifiedItems(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.add(key);
                                                            return newSet;
                                                        });
                                                    }
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
                                                const key = item.product_id;
                                                const i = newData.findIndex(x => x.product_id === key);
                                                if (i !== -1) {
                                                    newData[i].cost_price = Number(e.target.value);
                                                    setStockData(newData);
                                                    setModifiedItems(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(key);
                                                        return newSet;
                                                    });
                                                }
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
                                                const key = item.product_id;
                                                const i = newData.findIndex(x => x.product_id === key);
                                                if (i !== -1) {
                                                    newData[i].selling_price = Number(e.target.value);
                                                    setStockData(newData);
                                                    setModifiedItems(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(key);
                                                        return newSet;
                                                    });
                                                }
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
                                            <div className={`actionmenu ${isMenuNearBottom(index) ? 'menu-above' : ''}`}>
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
                </div>
                {isEditing && (
                    <div style={{marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <button className="savebtn" onClick={handleSave}>Save All Changes</button>
                        <button className="clearbtn" onClick={cancelEdit}>Cancel</button>
                        <span style={{marginLeft: '15px', color: '#666', fontSize: '14px'}}>
                            {modifiedItems.size > 0 ? `${modifiedItems.size} item(s) modified` : 'No changes yet - edit some fields above'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewStock;