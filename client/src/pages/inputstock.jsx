import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTruck, FaWarehouse, FaDollarSign, FaUserAlt, FaArrowLeft } from 'react-icons/fa';
import "./inputstock.css";

const InputStock = () => {
    const navigate = useNavigate();

    const getUserId = () => {
        try {
            return localStorage.getItem('userId') || 'admin';
        } catch {
            return 'admin';
        }
    };

    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        quantity: '',
        cost_price: '',
        selling_price: '',
        expiry_date: '',
        staple: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingNextId, setLoadingNextId] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const dropdownRef = useRef(null);
    const productNameRef = useRef(null);
    const productIdRef = useRef(null);

    // Fetch next available product ID
    //Auto-generate product ID


    const fetchNextProductId = async () => {
        setLoadingNextId(true);
        setError(''); // Clear any previous errors
        try {
            console.log('Fetching next product ID...');
            //API CALL
            const response = await axios.get('/api/stock/next-id');
            console.log('Next ID response:', response.data);
            // Update form data with the new product ID while preserving other fields
            setFormData(prev => {
                const newData = {
                    ...prev,
                    product_id: response.data.nextId
                };
                console.log('Setting form data with new product ID:', newData);
                return newData;
            });
        } catch (err) {
            //Error handling
            console.error('Failed to fetch next product ID:', err);
            console.error('Error details:', err.response?.data || err.message);
            setError(`Failed to generate product ID: ${err.response?.data?.error || err.message}. Please enter manually.`);
        } finally {
            //Reset loading state
            setLoadingNextId(false);
        }
    };

    // Search for products
    const searchProducts = async (query) => {
        if (!query || query.length < 1) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get(`/api/stock/search?q=${encodeURIComponent(query)}`);
            setSearchResults(response.data);
            setShowDropdown(response.data.length > 0);
        } catch (err) {
            console.error('Search failed:', err);
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle product selection from dropdown
    const handleProductSelect = (product) => {
        setFormData(prev => ({
            ...prev,
            product_id: product.product_id,
            product_name: product.product_name,
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            expiry_date: product.expiry_date || '',
            staple: product.staple,
            // Keep quantity empty as user is adding stock
        }));
        setShowDropdown(false);
        setSearchResults([]);
        setActiveField(null);
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                productNameRef.current && !productNameRef.current.contains(event.target) &&
                productIdRef.current && !productIdRef.current.contains(event.target)) {
                setShowDropdown(false);
                setActiveField(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load next product ID when component mounts
    useEffect(() => {
        fetchNextProductId();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Trigger search when typing in product name or product ID
        if (name === 'product_name' || name === 'product_id') {
            setActiveField(name);
            searchProducts(value);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        // Basic validation with specific feedback
        const missing = [];
        if (!formData.product_id) missing.push('Product ID');
        if (!formData.product_name) missing.push('Product Name');
        if (formData.quantity === '') missing.push('Quantity');
        if (formData.cost_price === '') missing.push('Cost Price');
        if (formData.selling_price === '') missing.push('Selling Price');
        if (missing.length) {
            setError(`Missing required fields: ${missing.join(', ')}`);
            return;
        }

        // Validate staple products must have expiry date
        if (formData.staple && (!formData.expiry_date || formData.expiry_date.trim() === '')) {
            setError('Staple products must have an expiry date. Please enter an expiry date or uncheck the staple option.');
            return;
        }
        //Data Transformation
        //Ensure numeric fields are numbers
        const payload = {
            product_id: String(formData.product_id),
            product_name: String(formData.product_name),
            quantity: Number(formData.quantity),
            cost_price: Number(formData.cost_price),
            selling_price: Number(formData.selling_price),
            expiry_date: formData.expiry_date || null,
            staple: !!formData.staple,
        };
        setLoading(true);
        try {
            // First check if product already exists
            const existingResponse = await axios.get(`/api/stock/search?q=${encodeURIComponent(formData.product_id)}`);
            const existingProduct = existingResponse.data.find(p => p.product_id === formData.product_id);

            if (existingProduct) {
                // Product exists - update existing product
                const updatedPayload = {
                    ...payload,
                    quantity: existingProduct.quantity + Number(formData.quantity) // Add to existing stock
                };

                // Count how many fields are being changed
                let changesCount = 1; // quantity is always changed
                if (Number(formData.cost_price) !== Number(existingProduct.cost_price)) changesCount++;
                if (Number(formData.selling_price) !== Number(existingProduct.selling_price)) changesCount++;
                if (formData.product_name !== existingProduct.product_name) changesCount++;
                if (!!formData.staple !== !!existingProduct.staple) changesCount++;
                const existingExpiry = existingProduct.expiry_date || '';
                const newExpiry = formData.expiry_date || '';
                if (existingExpiry !== newExpiry) changesCount++;

                await axios.put(`/api/stock/${existingProduct.id}`, updatedPayload, {
                    headers: { 'Content-Type': 'application/json' }
                });

                setSuccess(changesCount === 1 ? 'Change saved successfully!' : 'Changes saved successfully!');
            } else {
                // Product doesn't exist - create new product
                await axios.post('/api/stock', payload, { headers: { 'Content-Type': 'application/json' } });
                setSuccess('New product created successfully!');
            }

            // Reset form but keep the next auto-generated product ID
            const currentProductId = formData.product_id;
            setFormData({
                product_id: currentProductId,
                product_name: '',
                quantity: '',
                cost_price: '',
                selling_price: '',
                expiry_date: '',
                staple: false
            });
            // Fetch the next product ID for the next entry
            fetchNextProductId();
        } catch (err) {
            //Error handling
            const msg = err?.response?.data?.error || 'Error saving product. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFormData({
            product_id: '',
            product_name: '',
            quantity: '',
            cost_price: '',
            selling_price: '',
            expiry_date: '',
            staple: false
        });
        setError('');
        setSuccess('');
        // Fetch a new product ID after clearing
        fetchNextProductId();
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div className="page-wrapper">
            <div className="inputstockcontainer">
                <div className="inputstockheader">
                    <div className="navtab active">
                        <FaTruck className="tabicon" />
                        Input Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/viewstock')}>
                        <FaWarehouse className="tabicon" />
                        View Stock
                    </div>
                    <div className="navtab" onClick={() => navigate('/salesexpiry')}>
                        <FaDollarSign className="tabicon" />
                        Sales & Expiry
                    </div>
                </div>

                <div className="headeright">
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

            <div className="form-container">
                <div className="form-row">
                    <div className="form-group form-group-dropdown">
                        <label>Product ID:</label>
                        <input
                            ref={productIdRef}
                            type="text"
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder={loadingNextId ? "Generating..." : "Auto-generated or search existing"}
                            autoComplete="off"
                        />
                        {showDropdown && activeField === 'product_id' && (
                            <div ref={dropdownRef} className="search-dropdown">
                                {searchLoading ? (
                                    <div className="dropdown-item loading">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((product) => (
                                        <div
                                            key={product.id}
                                            className="dropdown-item"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="product-info">
                                                <span className="product-name">{product.product_name}</span>
                                                <span className="product-id">ID: {product.product_id}</span>
                                            </div>
                                            <div className="product-details">
                                                <span className="product-price">K{product.selling_price}</span>
                                                <span className="product-stock">Stock: {product.quantity}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="dropdown-item no-results">No products found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-group form-group-dropdown">
                        <label>Product Name:</label>
                        <input
                            ref={productNameRef}
                            type="text"
                            name="product_name"
                            value={formData.product_name}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter new product or search for existing product"
                            autoComplete="off"
                        />
                        {showDropdown && activeField === 'product_name' && (
                            <div ref={dropdownRef} className="search-dropdown">
                                {searchLoading ? (
                                    <div className="dropdown-item loading">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((product) => (
                                        <div
                                            key={product.id}
                                            className="dropdown-item"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="product-info">
                                                <span className="product-name">{product.product_name}</span>
                                                <span className="product-id">ID: {product.product_id}</span>
                                            </div>
                                            <div className="product-details">
                                                <span className="product-price">K{product.selling_price}</span>
                                                <span className="product-stock">Stock: {product.quantity}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="dropdown-item no-results">No products found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Quantity:</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="forminput"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Cost Price:</label>
                        <input
                            type="number"
                            name="cost_price"
                            value={formData.cost_price}
                            onChange={handleInputChange}
                            className="forminput"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Selling Price:</label>
                        <input
                            type="number"
                            name="selling_price"
                            value={formData.selling_price}
                            onChange={handleInputChange}
                            className="forminput"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="formrow">
                    <div className="formgroup">
                        <label>Expiry Date:</label>
                        <input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleInputChange}
                            className="forminput"
                            disabled={!formData.staple}
                        />
                    </div>

                    <div className="formgroup checkboxgroup">
                        <label className="checkboxlabel">
                            <input
                                type="checkbox"
                                name="staple"
                                checked={formData.staple}
                                onChange={handleInputChange}
                                className="staplecheckbox"
                            />
                            <span className="checkmark"></span>
                            STAPLE
                        </label>
                        <small className="checkboxhint">
                            Check if product has expiry date
                        </small>
                    </div>
                </div>

                <div className="buttonrow">
                    <button className="savebtn" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'SAVE'}
                    </button>
                    <button className="clearbtn" onClick={handleClear}>
                        CLEAR
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
            </div>
        </div>
    );
};

export default InputStock;