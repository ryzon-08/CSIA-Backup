import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaTrash, FaEdit, FaSave, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import "./viewstock.css";


const ViewStock = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const [stockData, setStockData] = useState([]);
    const [originalData, setOriginalData] = useState([]); // Store original data for comparison
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editRowId, setEditRowId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [modifiedCount, setModifiedCount] = useState(0);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const fetchStock = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5001/api/stock');
            setStockData(res.data);
            setOriginalData(JSON.parse(JSON.stringify(res.data))); // Deep copy for comparison
            setModifiedCount(0); // Reset modification count
        } catch (e) {
            setError('Failed to load stock');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    // Function to count modified items
    const countModifiedItems = (currentData, originalData) => {
        if (!originalData.length || !currentData.length) return 0;
        
        let count = 0;
        currentData.forEach(currentItem => {
            const originalItem = originalData.find(orig => 
                (orig.id ?? orig.product_id) === (currentItem.id ?? currentItem.product_id)
            );
            
            if (originalItem) {
                // Check if any field has been modified
                const isModified = 
                    currentItem.product_id !== originalItem.product_id ||
                    currentItem.product_name !== originalItem.product_name ||
                    currentItem.quantity !== originalItem.quantity ||
                    currentItem.cost_price !== originalItem.cost_price ||
                    currentItem.selling_price !== originalItem.selling_price ||
                    currentItem.staple !== originalItem.staple ||
                    currentItem.expiry_date !== originalItem.expiry_date;
                
                if (isModified) count++;
            }
        });
        
        return count;
    };

    // Update modification count whenever stockData changes
    useEffect(() => {
        if (isEditing && originalData.length > 0) {
            const count = countModifiedItems(stockData, originalData);
            setModifiedCount(count);
        }
    }, [stockData, originalData, isEditing]);

    // Handle checkbox selection
    const handleItemSelection = (itemId, isChecked) => {
        const newSelected = new Set(selectedItems);
        if (isChecked) {
            newSelected.add(itemId);
        } else {
            newSelected.delete(itemId);
        }
        setSelectedItems(newSelected);
    };

    // Handle select all checkbox
    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            const allIds = stockData.map(item => item.id ?? item.product_id);
            setSelectedItems(new Set(allIds));
        } else {
            setSelectedItems(new Set());
        }
    };

    // Bulk delete function
    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) {
            alert('Please select items to delete');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} selected item(s)?`)) {
            return;
        }

        try {
            // Delete all selected items
            const deletePromises = Array.from(selectedItems).map(itemId =>
                axios.delete(`http://localhost:5001/api/stock/${itemId}`)
            );
            
            await Promise.all(deletePromises);
            setSelectedItems(new Set()); // Clear selection
            fetchStock(); // Refresh the data
        } catch (e) {
            console.error('Bulk delete error:', e);
            alert('Failed to delete some items');
        }
    };




    const handleEdit = (rowKey) => {
        setEditRowId(rowKey);
        setIsEditing(true);
        // Initialize draft with the selected row's data
        const row = stockData.find(x => (x.id ?? x.product_id) === rowKey);
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
        console.log('Save button clicked!');
        console.log('Current stockData:', stockData);
        
        // Validation for staple/expiry date relationship
        const productsWithoutExpiry = [];
        const productsWithExpiryButNotStaple = [];
        
        for (const item of stockData) {
            // Check if item is being changed from staple to non-staple but has expiry date
            if (!item.staple && item.expiry_date) {
                productsWithExpiryButNotStaple.push(item.product_name);
            }
            
            // Check if item is staple but has no expiry date
            if (item.staple && (!item.expiry_date || item.expiry_date === '')) {
                productsWithoutExpiry.push(item.product_name);
            }
        }
        
        // Show all products that are staple but missing expiry dates
        if (productsWithoutExpiry.length > 0) {
            const productList = productsWithoutExpiry.map(name => `"${name}"`).join(', ');
            alert(`The following products are marked as staple but have no expiry date: ${productList}. Please enter expiry dates for all staple products.`);
            return; // Cancel save operation
        }
        
        // Handle products with expiry date but not marked as staple
        if (productsWithExpiryButNotStaple.length > 0) {
            const productList = productsWithExpiryButNotStaple.join(', ');
            const confirmMessage = `The following products have expiry dates but are not marked as staple: ${productList}.\n\nAre you sure you want to continue? The expiry dates will be reset.`;
            if (!window.confirm(confirmMessage)) {
                return; // Cancel save operation
            }
            // Reset expiry dates for these items
            stockData.forEach(item => {
                if (!item.staple && item.expiry_date) {
                    item.expiry_date = null;
                }
            });
        }

        try {
            // Save all modified items one by one to avoid conflicts
            for (const item of stockData) {
                const payload = {
                    product_id: String(item.product_id ?? item.id),
                    product_name: String(item.product_name ?? item.name),
                    quantity: Number(item.quantity),
                    cost_price: Number(item.cost_price),
                    selling_price: Number(item.selling_price),
                    staple: !!item.staple,
                    expiry_date: item.expiry_date || null,
                };
                
                // Use the database ID (item.id) for the update, not product_id
                const updateId = item.id ?? item.product_id;
                if (!updateId) {
                    console.error('Missing ID for item:', item);
                    continue;
                }
                
                console.log(`Updating item ${updateId} with payload:`, payload);
                await axios.put(`http://localhost:5001/api/stock/${updateId}`, payload, { 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            
            setEditRowId(null);
            setDraft({});
            setIsEditing(false);
            // Reload data to get fresh state
            fetchStock();
        } catch (e) {
            console.error('Save error:', e);
            console.error('Error response:', e.response?.data);
            alert(e?.response?.data?.error || 'Failed to save changes');
        }
    };

    const cancelEdit = () => {
        console.log('Cancel button clicked!');
        setIsEditing(false);
        setEditRowId(null);
        setDraft({});
        setSelectedItems(new Set()); // Clear selections
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

                <div className="header-center">
                    <div className="searchcontainer">
                        <input
                            type="text"
                            placeholder="Enter Product ID/Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="searchinput"
                        />
                    </div>
                </div>

                <div className="header-center">
                    <button className="backbtn" onClick={() => navigate('/dashboard')}>
                        ←
                    </button>
                </div>

                <div className="headeright">
                    <div className="usersection">
                        <div className="userlogo">
                            <FaUserAlt className="usericon" />
                        </div>
                        <span className="user-id">{localStorage.getItem('userId') || 'admin'}</span>
                    </div>
                </div>
            </div>

            <div className="tablecontainer">
                <div className="table-scroll-wrapper">
                    <table className="stocktable">
                    <thead>
                        <tr>
                            {isEditing && (
                                <th>
                                    <input 
                                        type="checkbox" 
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        checked={selectedItems.size > 0 && selectedItems.size === stockData.length}
                                    />
                                </th>
                            )}
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
                            <tr key={(item.id ?? item.product_id ?? index)}>
                                {isEditing && (
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.has(item.id ?? item.product_id)}
                                            onChange={(e) => handleItemSelection(item.id ?? item.product_id, e.target.checked)}
                                        />
                                    </td>
                                )}
                                <td>
                                    {isEditing ? (
                                        <input className="tableinput" value={item.product_id ?? item.id} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].product_id = e.target.value;
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.product_id ?? item.id
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input className="tableinput" value={item.product_name ?? item.name} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].product_name = e.target.value;
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.product_name ?? item.name
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input type="number" className="tableinput" value={item.quantity} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].quantity = Number(e.target.value);
                                                setStockData(newData);
                                            }
                                        }} />
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
                                        <input type="date" className="tableinput" value={item.expiry_date ? String(item.expiry_date).substring(0,10) : ''} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].expiry_date = e.target.value;
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.staple ? (item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '') : ''
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input type="number" step="0.01" className="tableinput" value={item.cost_price} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].cost_price = Number(e.target.value);
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.cost_price
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input type="number" step="0.01" className="tableinput" value={item.selling_price} onChange={e => {
                                            const newData = [...stockData];
                                            const index = newData.findIndex(x => (x.id ?? x.product_id) === (item.id ?? item.product_id));
                                            if (index !== -1) {
                                                newData[index].selling_price = Number(e.target.value);
                                                setStockData(newData);
                                            }
                                        }} />
                                    ) : (
                                        item.selling_price
                                    )}
                                </td>
                                <td className="actionscell">
                                    <button 
                                        className="editbtn"
                                        onClick={() => handleEdit(item.id ?? item.product_id)}
                                        title="Edit Item"
                                    >
                                        <FaEdit />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                {isEditing && (
                    <div className="edit-buttons-container">
                        <div className="modification-counter">
                            {modifiedCount} item{modifiedCount !== 1 ? 's' : ''} modified
                        </div>
                        {selectedItems.size > 0 && (
                            <div className="selected-counter">
                                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                            </div>
                        )}
                        {selectedItems.size > 0 && (
                            <button className="deletebtn" onClick={handleBulkDelete}>
                                <FaTrash /> Delete Selected
                            </button>
                        )}
                        <button className="savebtn" onClick={handleSave}>Save All Changes</button>
                        <button className="clearbtn" onClick={cancelEdit}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewStock;