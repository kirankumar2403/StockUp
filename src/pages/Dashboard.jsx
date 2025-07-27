import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    FaTachometerAlt, FaBoxOpen, FaChartBar,
    FaCog, FaChevronDown, FaBell, FaUsers,
    FaPlus, FaPencilAlt, FaTrash, FaSpinner
} from 'react-icons/fa';
import io from 'socket.io-client';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const socket = io('https://stockup-l530.onrender.com');

// --- SUB-COMPONENTS (Defined within this file) ---

// NEW: Welcome Landing Page Content
const WelcomePageContent = ({ currentUser, onProceedToDashboard }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 bg-gray-800 rounded-lg shadow-lg text-white text-center">
            <h2 className="text-4xl font-bold text-purple-400 mb-4 animate-fade-in">
                Welcome to StockUp!
            </h2>
            <p className="text-xl text-gray-300 mb-6 animate-fade-in animation-delay-100">
                Hello, <span className="font-semibold text-yellow-400">{currentUser?.email || currentUser?.username || 'User'}</span>!
            </p>
            <p className="text-lg text-gray-400 mb-8 animate-fade-in animation-delay-200">
                Your inventory is waiting. Let's get started.
            </p>
            <button
                onClick={onProceedToDashboard}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold text-lg transition-colors duration-300 flex items-center justify-center gap-2 animate-fade-in animation-delay-300"
                type="button"
            >
                Go to Dashboard <FaTachometerAlt className="ml-2" />
            </button>
            {/* Optional: Basic CSS for the animation if you don't have it globally */}
            <style>
                {`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                .animation-delay-100 { animation-delay: 0.1s; }
                .animation-delay-200 { animation-delay: 0.2s; }
                .animation-delay-300 { animation-delay: 0.3s; }
                `}
            </style>
        </div>
    );
};


// ProductForm for Add/Edit Product Modal
const ProductForm = ({ productToEdit, onClose, onProductSaved }) => {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        barcode: '',
        category: '',
        brand: '',
        stock: 0,
        threshold: 5,
        price: 0,
        expiryDate: null,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        const fetchDependencies = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const [catRes, brandRes] = await Promise.all([
                    fetch('https://stockup-l530.onrender.com/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('https://stockup-l530.onrender.com/api/brands', { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const catData = await catRes.json();
                const brandData = await brandRes.json();

                if (catRes.ok) setCategories(catData.filter(cat => cat && cat._id && cat.name));
                else console.error('Failed to fetch categories:', catData.message);

                if (brandRes.ok) setBrands(brandData.filter(brand => brand && brand._id && brand.name));
                else console.error('Failed to fetch brands:', brandData.message);

            } catch (error) {
                console.error('Failed to fetch categories or brands:', error);
                setGeneralError('Failed to load categories or brands. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchDependencies();

        if (productToEdit) {
            setFormData({
                sku: productToEdit.sku || '',
                name: productToEdit.name || '',
                barcode: productToEdit.barcode || '',
                category: productToEdit.category?._id || '',
                brand: productToEdit.brand?._id || '',
                stock: productToEdit.stock || 0,
                threshold: productToEdit.threshold || 5,
                price: productToEdit.price || 0,
                expiryDate: productToEdit.expiryDate ? new Date(productToEdit.expiryDate) : null,
            });
        }
    }, [productToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: ['stock', 'threshold', 'price'].includes(name) ? Number(value) : value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        setGeneralError('');
    };

    const handleDateChange = (date) => {
        setFormData((prevData) => ({
            ...prevData,
            expiryDate: date,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, expiryDate: '' }));
        setGeneralError('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required.';
        else if (formData.name.trim().length < 2) newErrors.name = 'Product name must be at least 2 characters.';

        if (!formData.sku.trim()) newErrors.sku = 'SKU is required.';
        else if (!/^[A-Z0-9-]{3,20}$/.test(formData.sku.trim())) newErrors.sku = 'SKU must be 3-20 uppercase alphanumeric characters or hyphens.';

        if (formData.barcode && !/^\d{8,13}$/.test(formData.barcode.trim())) newErrors.barcode = 'Barcode must be 8-13 digits.';

        if (formData.stock === '' || isNaN(formData.stock) || formData.stock < 0) newErrors.stock = 'Stock must be a non-negative number.';
        if (formData.threshold === '' || isNaN(formData.threshold) || formData.threshold < 0) newErrors.threshold = 'Threshold must be a non-negative number.';
        if (formData.price === '' || isNaN(formData.price) || formData.price < 0) newErrors.price = 'Price must be a non-negative number.';

        if (!formData.category) newErrors.category = 'Category is required.';

        if (formData.expiryDate && formData.expiryDate <= new Date()) newErrors.expiryDate = 'Expiry date must be in the future.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError('Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        const method = productToEdit ? 'PUT' : 'POST';
        const url = productToEdit ? `https://stockup-l530.onrender.com/api/products/${productToEdit._id}` : 'https://stockup-l530.onrender.com/api/products';
        const token = localStorage.getItem('token');

        const payload = {
            ...formData,
            expiryDate: formData.expiryDate ? formData.expiryDate.toISOString() : null,
            brand: formData.brand || null,
            category: formData.category || null,
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                    setGeneralError(data.message || 'Please fix the highlighted errors.');
                } else {
                    setGeneralError(data.message || 'An error occurred while saving the product.');
                }
                throw new Error(data.message || 'Failed to save product');
            }

            onProductSaved(data.product);
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-2xl font-semibold text-white mb-6">
                    {productToEdit ? 'Edit Product' : 'Create New Product'}
                </h2>
                {generalError && <p className="text-red-500 mb-4 text-center">{generalError}</p>}
                {loading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                        <FaSpinner className="text-purple-400 text-4xl animate-spin" />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-1">Product Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                placeholder="e.g., Wireless Mouse"
                                required
                                disabled={loading}
                            />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="sku" className="block text-gray-300 text-sm font-medium mb-1">SKU</label>
                            <input
                                type="text"
                                id="sku"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white uppercase focus:outline-none focus:ring-2 ${errors.sku ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                placeholder="e.g., WM-001"
                                required
                                disabled={loading}
                            />
                            {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="barcode" className="block text-gray-300 text-sm font-medium mb-1">Barcode (Optional)</label>
                            <input
                                type="text"
                                id="barcode"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.barcode ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                placeholder="e.g., 1234567890123"
                                disabled={loading}
                            />
                            {errors.barcode && <p className="text-red-400 text-xs mt-1">{errors.barcode}</p>}
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-gray-300 text-sm font-medium mb-1">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.category ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                required
                                disabled={loading}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="brand" className="block text-gray-300 text-sm font-medium mb-1">Brand (Optional)</label>
                            <select
                                id="brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.brand ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                disabled={loading}
                            >
                                <option value="">Select Brand</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                                ))}
                            </select>
                            {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-gray-300 text-sm font-medium mb-1">Current Stock</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.stock ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                min="0"
                                required
                                disabled={loading}
                            />
                            {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-gray-300 text-sm font-medium mb-1">Price</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.price ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                min="0"
                                step="0.01"
                                required
                                disabled={loading}
                            />
                            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
                        </div>
                        <div>
                            <label htmlFor="threshold" className="block text-gray-300 text-sm font-medium mb-1">Low Stock Threshold</label>
                            <input
                                type="number"
                                id="threshold"
                                name="threshold"
                                value={formData.threshold}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.threshold ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                min="0"
                                required
                                disabled={loading}
                            />
                            {errors.threshold && <p className="text-red-400 text-xs mt-1">{errors.threshold}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expiryDate" className="block text-gray-300 text-sm font-medium mb-1">Expiry Date (Optional)</label>
                            <DatePicker
                                id="expiryDate"
                                name="expiryDate"
                                selected={formData.expiryDate}
                                onChange={handleDateChange}
                                dateFormat="yyyy/MM/dd"
                                minDate={new Date()}
                                isClearable
                                placeholderText="Select expiry date"
                                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.expiryDate ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                                wrapperClassName="w-full"
                                disabled={loading}
                            />
                            {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
                        </div>
                    </div>


                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-medium transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : productToEdit ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// CategoryForm for Add/Edit Category Modal
function CategoryForm({ categoryToEdit, onClose, onCategorySaved }) {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name || '',
                description: categoryToEdit.description || ''
            });
        }
    }, [categoryToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        setGeneralError('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Category name is required.';
        else if (formData.name.trim().length < 2) newErrors.name = 'Category name must be at least 2 characters.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError('Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        const method = categoryToEdit ? 'PUT' : 'POST';
        const url = categoryToEdit ? `https://stockup-l530.onrender.com/api/categories/${categoryToEdit._id}` : 'https://stockup-l530.onrender.com/api/categories';
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                    setGeneralError('Please fix the highlighted errors.');
                } else {
                    setGeneralError(data.message || 'An error occurred while saving the category.');
                }
                throw new Error(data.message || 'Failed to save category');
            }

            onCategorySaved(data.category);
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-2xl font-semibold text-white mb-6">
                    {categoryToEdit ? 'Edit Category' : 'Create New Category'}
                </h2>
                {generalError && <p className="text-red-500 mb-4 text-center">{generalError}</p>}
                {loading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                        <FaSpinner className="text-purple-400 text-4xl animate-spin" />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="categoryName" className="block text-gray-300 text-sm font-medium mb-1">Category Name</label>
                        <input
                            type="text"
                            id="categoryName"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., Electronics"
                            required
                            disabled={loading}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="categoryDescription" className="block text-gray-300 text-sm font-medium mb-1">Description (Optional)</label>
                        <textarea
                            id="categoryDescription"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., Products related to computing and gadgets."
                            disabled={loading}
                        ></textarea>
                        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-medium transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : categoryToEdit ? 'Update Category' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// BrandForm for Add/Edit Brand Modal
function BrandForm({ brandToEdit, onClose, onBrandSaved }) {
    const [formData, setFormData] = useState({
        name: '',
        website: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState(''); // Corrected initialization

    useEffect(() => {
        if (brandToEdit) {
            setFormData({
                name: brandToEdit.name || '',
                website: brandToEdit.website || ''
            });
        }
    }, [brandToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        setGeneralError('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Brand name is required.';
        else if (formData.name.trim().length < 1) newErrors.name = 'Brand name must be at least 1 character.';

        if (formData.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.website)) {
            newErrors.website = 'Please enter a valid website URL.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError('Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        const method = brandToEdit ? 'PUT' : 'POST';
        const url = brandToEdit ? `https://stockup-l530.onrender.com/api/brands/${brandToEdit._id}` : 'https://stockup-l530.onrender.com/api/brands';
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                    setGeneralError('Please fix the highlighted errors.');
                } else {
                    setGeneralError(data.message || 'An error occurred while saving the brand.');
                }
                throw new Error(data.message || 'Failed to save brand');
            }

            onBrandSaved(data.brand);
            onClose();
        } catch (error) {
            console.error('Error saving brand:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-2xl font-semibold text-white mb-6">
                    {brandToEdit ? 'Edit Brand' : 'Create New Brand'}
                </h2>
                {generalError && <p className="text-red-500 mb-4 text-center">{generalError}</p>}
                {loading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                        <FaSpinner className="text-purple-400 text-4xl animate-spin" />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="brandName" className="block text-gray-300 text-sm font-medium mb-1">Brand Name</label>
                        <input
                            type="text"
                            id="brandName"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., Apple"
                            required
                            disabled={loading}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="brandWebsite" className="block text-gray-300 text-sm font-medium mb-1">Website (Optional)</label>
                        <input
                            type="url"
                            id="brandWebsite"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.website ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., https://www.apple.com"
                            disabled={loading}
                        />
                        {errors.website && <p className="text-red-400 text-xs mt-1">{errors.website}</p>}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-medium transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : brandToEdit ? 'Update Brand' : 'Create Brand'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Dashboard Content Components (Rendered based on activeTab) ---

// Component for Product Dashboard section

function ProductDashboardContent({ userRole }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productError, setProductError] = useState('');
    const [showProductForm, setShowProductForm] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');


    // Fetch products, categories, and brands on component mount or when needed
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchBrands();
    }, [selectedCategory, selectedBrand, searchTerm]); // Added searchTerm to dependencies to trigger product re-fetch on search

    // Function to fetch categories for filter options
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://stockup-l530.onrender.com/api/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch categories');
            }
            setCategories(data.filter(cat => cat && cat._id && cat.name));
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Function to fetch brands for filter options
    const fetchBrands = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://stockup-l530.onrender.com/api/brands', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch brands');
            }
            setBrands(data.filter(brand => brand && brand._id && brand.name));
        } catch (err) {
            console.error('Error fetching brands:', err);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        setProductError('');
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (selectedCategory) queryParams.append('category', selectedCategory);
            if (selectedBrand) queryParams.append('brand', selectedBrand);
            if (searchTerm) queryParams.append('search', searchTerm);


            const res = await fetch(`https://stockup-l530.onrender.com/api/products?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setProductError(err.message || 'Failed to load products. Please try again.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCreateProductClick = () => {
        setProductToEdit(null);
        setShowProductForm(true);
    };

    const handleEditProductClick = (product) => {
        setProductToEdit(product);
        setShowProductForm(true);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        setLoadingProducts(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete product');
            }

            setProducts(products.filter(p => p._id !== productId));
            alert('Product deleted successfully!');
        } catch (err) {
            console.error('Error deleting product:', err);
            setProductError(err.message || 'Failed to delete product.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleProductSaved = (savedProduct) => {
        fetchProducts();
        fetchCategories();
        fetchBrands();
    };

    // --- NEW EXCEL EXPORT FUNCTION ---
    const handleExportExcel = () => {
        if (products.length === 0) {
            alert("No products to export.");
            return;
        }

        const dataForExcel = products.map(product => ({
            "Product Name": product.name,
            "SKU": product.sku,
            "Barcode": product.barcode || '',
            "Category": product.category ? product.category.name : 'N/A',
            "Brand": product.brand ? product.brand.name : 'N/A',
            "Current Stock": product.stock,
            "Threshold": product.threshold,
            "Price": product.price,
            "Expiry Date": product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-IN') : 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products Inventory");

        const fileName = `stocksense_products_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(wb, fileName);
    };
    // --- END NEW EXCEL EXPORT FUNCTION ---


    if (loadingProducts && products.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading products...
            </div>
        );
    }

    if (productError) {
        return <div className="text-center py-8 text-red-500">Error: {productError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Product Dashboard</h3>
                <div className="flex space-x-3">
                    {/* Filter dropdown for categories */}
                    <select
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        value={selectedCategory}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                    </select>

                    {/* Filter dropdown for brands */}
                    <select
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        value={selectedBrand}
                    >
                        <option value="">All Brands</option>
                        {brands.map(brand => (
                            <option key={brand._id} value={brand._id}>{brand.name}</option>
                        ))}
                    </select>

                    {/* Export to Excel button - Conditional Rendering for Staff */}
                    {userRole === 'admin' && ( // Only show for Admin
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition flex items-center gap-2"
                            type="button"
                        >
                            Export Excel
                        </button>
                    )}

                    {userRole === 'admin' && (
                        <button
                            onClick={handleCreateProductClick}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2"
                            type="button"
                        >
                            <FaPlus /> Create Product
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <input
                    type="text"
                    placeholder="Search products..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            fetchProducts();
                        }
                    }}
                />
                <button
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-medium transition"
                    type="button"
                    onClick={fetchProducts}
                >
                    Filter
                </button>
            </div>

            {products.length === 0 && !loadingProducts ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No products found. Start by creating a new product!</p>
                    {userRole === 'admin' && (
                        <button
                            onClick={handleCreateProductClick}
                            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2 mx-auto"
                            type="button"
                        >
                            <FaPlus /> Create First Product
                        </button>
                    )}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Brand</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Threshold</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry Date</th>
                            {/* MODIFIED: Show Actions column for Admin OR Staff */}
                            {(userRole === 'admin' || userRole === 'staff') && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {products.map(product => (
                            <tr key={product._id}>
                                <td className="px-4 py-2">{product.name}</td>
                                <td className="px-4 py-2">{product.sku}</td>
                                <td className="px-4 py-2">{product.category ? product.category.name : 'N/A'}</td>
                                <td className="px-4 py-2">{product.brand ? product.brand.name : 'N/A'}</td>
                                <td className={`px-4 py-2 ${product.stock <= product.threshold ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                                    {product.stock}
                                </td>
                                <td className="px-4 py-2">{product.threshold}</td>
                                <td className="px-4 py-2">{product.price || '0'}</td>
                                <td className="px-4 py-2">
                                    {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                                {/* MODIFIED: Show Edit/Delete buttons for Admin OR Staff */}
                                {(userRole === 'admin' || userRole === 'staff') && (
                                    <td className="px-4 py-2 flex space-x-2">
                                        <button
                                            onClick={() => handleEditProductClick(product)}
                                            className="text-blue-400 hover:text-blue-600"
                                            title="Edit Product"
                                            type="button"
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product._id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete Product"
                                            type="button"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Product Form Modal */}
            {showProductForm && (
                <ProductForm
                    productToEdit={productToEdit}
                    onClose={() => setShowProductForm(false)}
                    onProductSaved={handleProductSaved}
                />
            )}
        </div>
    );
}

// Component for Categories section
function CategoryContent({ userRole }) {
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState('');
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        setCategoryError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://stockup-l530.onrender.com/api/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch categories');
            }
            setCategories(data.filter(cat => cat && cat._id && cat.name));
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleCreateCategoryClick = () => {
        setCategoryToEdit(null);
        setShowCategoryForm(true);
    };

    const handleEditCategoryClick = (category) => {
        setCategoryToEdit(category);
        setShowCategoryForm(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Deleting a category is irreversible and might affect associated products. Are you sure?')) {
            return;
        }

        setLoadingCategories(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete category');
            }

            setCategories(categories.filter(c => c._id !== categoryId));
            alert('Category deleted successfully!');
        } catch (err) {
            console.error('Error deleting category:', err);
            alert(err.message || 'Failed to delete category.');
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleCategorySaved = (savedCategory) => {
        fetchCategories();
    };

    if (loadingCategories && categories.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading categories...
            </div>
        );
    }

    if (categoryError) {
        return <div className="text-center py-8 text-red-500">Error: {categoryError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Product Categories</h3>
                {userRole === 'admin' && (
                    <button
                        onClick={handleCreateCategoryClick}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2"
                        type="button"
                    >
                        <FaPlus /> Create Category
                    </button>
                )}
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No categories found. Start by creating a new category!</p>
                    {userRole === 'admin' && (
                        <button
                            onClick={handleCreateCategoryClick}
                            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2 mx-auto"
                            type="button"
                        >
                            <FaPlus /> Create First Category
                        </button>
                    )}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                            {/* MODIFIED: Show Actions column for Admin OR Staff */}
                            {(userRole === 'admin' || userRole === 'staff') && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {categories.map(category => (
                            <tr key={category._id}>
                                <td className="px-4 py-2">{category.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-400">{category.description || 'N/A'}</td>
                                {/* MODIFIED: Show Edit/Delete buttons for Admin OR Staff */}
                                {(userRole === 'admin' || userRole === 'staff') && (
                                    <td className="px-4 py-2 flex space-x-2">
                                        <button
                                            onClick={() => handleEditCategoryClick(category)}
                                            className="text-blue-400 hover:text-blue-600"
                                            title="Edit Category"
                                            type="button"
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category._id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete Category"
                                            type="button"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Category Form Modal */}
            {showCategoryForm && (
                <CategoryForm
                    categoryToEdit={categoryToEdit}
                    onClose={() => setShowCategoryForm(false)}
                    onCategorySaved={handleCategorySaved}
                />
            )}
        </div>
    );
}


function BrandContent({ userRole }) {
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [brandError, setBrandError] = useState('');
    const [showBrandForm, setShowBrandForm] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState(null);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoadingBrands(true);
        setBrandError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://stockup-l530.onrender.com/api/brands', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch brands');
            }
            setBrands(data.filter(brand => brand && brand._id && brand.name));
        } catch (err) {
            console.error('Error fetching brands:', err);
        } finally {
            setLoadingBrands(false);
        }
    };

    const handleCreateBrandClick = () => {
        setBrandToEdit(null);
        setShowBrandForm(true);
    };

    const handleEditBrandClick = (brand) => {
        setBrandToEdit(brand);
        setShowBrandForm(true);
    };

    const handleDeleteBrand = async (brandId) => {
        if (!window.confirm('Deleting a brand is irreversible and might affect associated products. Are you sure?')) {
            return;
        }

        setLoadingBrands(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/brands/${brandId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete brand');
            }

            setBrands(brands.filter(b => b._id !== brandId));
            alert('Brand deleted successfully!');
        } catch (err) {
            console.error('Error deleting brand:', err);
            alert(err.message || 'Failed to delete brand.');
        } finally {
            setLoadingBrands(false);
        }
    };

    const handleBrandSaved = (savedBrand) => {
        fetchBrands();
    };

    if (loadingBrands && brands.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading brands...
            </div>
        );
    }

    if (brandError) {
        return <div className="text-center py-8 text-red-500">Error: {brandError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Product Brands</h3>
                {userRole === 'admin' && (
                    <button
                        onClick={handleCreateBrandClick}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2"
                        type="button"
                    >
                        <FaPlus /> Create Brand
                    </button>
                )}
            </div>

            {brands.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No brands found. Start by creating a new brand!</p>
                    {userRole === 'admin' && (
                        <button
                            onClick={handleCreateBrandClick}
                            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2 mx-auto"
                            type="button"
                        >
                            <FaPlus /> Create First Brand
                        </button>
                    )}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Website</th>
                            {/* MODIFIED: Show Actions column for Admin OR Staff */}
                            {(userRole === 'admin' || userRole === 'staff') && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {brands.map(brand => (
                            <tr key={brand._id}>
                                <td className="px-4 py-2">{brand.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-400">
                                    {brand.website ? (
                                        <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            {brand.website.replace(/^(https?:\/\/)/, '')}
                                        </a>
                                    ) : 'N/A'}
                                </td>
                                {/* MODIFIED: Show Edit/Delete buttons for Admin OR Staff */}
                                {(userRole === 'admin' || userRole === 'staff') && (
                                    <td className="px-4 py-2 flex space-x-2">
                                        <button
                                            onClick={() => handleEditBrandClick(brand)}
                                            className="text-blue-400 hover:text-blue-600"
                                            title="Edit Brand"
                                            type="button"
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBrand(brand._id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete Brand"
                                            type="button"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Brand Form Modal */}
            {showBrandForm && (
                <BrandForm
                    brandToEdit={brandToEdit}
                    onClose={() => setShowBrandForm(false)}
                    onBrandSaved={handleBrandSaved}
                />
            )}
        </div>
    );
}


function AlertsContent({ userRole }) {
    const [alerts, setAlerts] = useState([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [alertsError, setAlertsError] = useState('');

    const fetchAlerts = async () => {
        setLoadingAlerts(true);
        setAlertsError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setAlertsError('Authentication token not found. Please log in.');
                setLoadingAlerts(false);
                return;
            }
            const res = await fetch('https://stockup-l530.onrender.com/api/alerts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch alerts');
            }
            setAlerts(data);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setAlertsError(err.message || 'Failed to load alerts. Please try again.');
        } finally {
            setLoadingAlerts(false);
        }
    };

    useEffect(() => {
        fetchAlerts();

        console.log('Attempting to set up Socket.IO listener for low_stock_alert');
        socket.on('low_stock_alert', (newAlert) => {
            console.log('Received real-time low_stock_alert:', newAlert);

            setAlerts(prevAlerts => {
                const exists = prevAlerts.some(alert => alert._id === newAlert._id);
                if (!exists) {
                    return [...prevAlerts, newAlert];
                }
                return prevAlerts;
            });

            if (window.Notification && Notification.permission === 'granted') {
                new Notification('StockSense Alert!', {
                    body: newAlert.message,
                    icon: '/stocksense-icon.png'
                });
            }
        });

        if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                } else {
                    console.warn('Notification permission denied.');
                }
            });
        }

        return () => {
            console.log('Cleaning up Socket.IO listener');
            socket.off('low_stock_alert');
        };
    }, []);


    const resolveAlert = async (id) => {
        if (!window.confirm('Are you sure you want to mark this alert as resolved?')) {
            return;
        }
        setLoadingAlerts(true);
        setAlertsError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/alerts/${id}/resolve`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to resolve alert');
            }
            alert('Alert marked as resolved!');
            fetchAlerts();
        } catch (err) {
            console.error('Error resolving alert:', err);
            setAlertsError(err.message || 'Failed to resolve alert.');
        } finally {
            setLoadingAlerts(false);
        }
    };

    const generatePO = async (id) => {
        if (!window.confirm('Generate a Purchase Order for this alert?')) {
            return;
        }
        setLoadingAlerts(true);
        setAlertsError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/alerts/${id}/generate-po`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate PO');
            }
            alert(data.message || 'Purchase Order generated (check backend logs/email for details)!');
            fetchAlerts();
        } catch (err) {
            console.error('Error generating PO:', err);
            setAlertsError(err.message || 'Failed to generate PO.');
        } finally {
            setLoadingAlerts(false);
        }
    };

    if (loadingAlerts && alerts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading alerts...
            </div>
        );
    }

    if (alertsError) {
        return <div className="text-center py-8 text-red-500">Error: {alertsError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Low-Stock Alerts</h3>
            <ul className="space-y-4">
                {alerts.length === 0 && !loadingAlerts ? (
                    <li className="text-gray-400">No active low-stock alerts.</li>
                ) : (
                    alerts.map(alert => (
                        <li
                            key={alert._id}
                            className={`flex flex-col md:flex-row items-start md:items-center justify-between rounded-lg p-4 border
                                ${alert.resolved ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-red-900 bg-opacity-40 border-red-500'}`}
                        >
                            <div className="flex-1 mb-2 md:mb-0">
                                <span className="text-yellow-400 font-bold block md:inline-block">{alert.product?.name || 'Product (N/A)'}</span>
                                <span className="text-gray-300 ml-0 md:ml-2 block md:inline-block text-sm">{alert.message}</span>
                                {alert.createdAt && (
                                    <span className="text-gray-500 text-xs block md:inline-block md:ml-2 mt-1 md:mt-0">
                                        ({new Date(alert.createdAt).toLocaleString()})
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-2 flex-wrap justify-end mt-2 md:mt-0">
                                {/* Conditional Rendering for Staff */}
                                {userRole === 'admin' && ( // Only show for Admin
                                    <>
                                        {!alert.poGenerated && !alert.resolved && (
                                            <button
                                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition"
                                                onClick={() => generatePO(alert._id)}
                                                type="button"
                                            >
                                                Generate PO
                                            </button>
                                        )}
                                        {alert.poGenerated && <span className="text-blue-400 font-bold text-sm">PO Generated</span>}

                                        {!alert.resolved && (
                                            <button
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition ml-2"
                                                onClick={() => resolveAlert(alert._id)}
                                                type="button"
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                    </>
                                )}
                                {alert.resolved && <span className="text-green-400 font-bold text-sm ml-2">Resolved</span>}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

// Component for Reports section (Placeholder functionality with Chart.js integration)
function ReportsContent() {
    const [summary, setSummary] = useState({ totalProducts: 0, lowStockCount: 0, inventoryValue: 0 });
    const [stockTrends, setStockTrends] = useState([]);
    const [topSelling, setTopSelling] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [reportsError, setReportsError] = useState('');

    useEffect(() => {
        const fetchReportsData = async () => {
            setLoadingReports(true);
            setReportsError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setReportsError('Authentication token not found. Please log in.');
                    setLoadingReports(false);
                    return;
                }

                const [summaryRes, trendsRes, topSellingRes] = await Promise.all([
                    fetch('https://stockup-l530.onrender.com/api/products/summary', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('https://stockup-l530.onrender.com/api/products/stock-trends', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('https://stockup-l530.onrender.com/api/products/top-selling', { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const summaryData = await summaryRes.json();
                const trendsData = await trendsRes.json();
                const topSellingData = await topSellingRes.json();

                if (!summaryRes.ok) throw new Error(summaryData.message || 'Failed to fetch summary');
                if (!trendsRes.ok) throw new Error(trendsData.message || 'Failed to fetch stock trends');
                if (!topSellingRes.ok) throw new Error(topSellingData.message || 'Failed to fetch top selling products');

                setSummary(summaryData);
                setStockTrends(trendsData);
                setTopSelling(topSellingData);

            } catch (err) {
                console.error('Error fetching reports:', err);
                setReportsError(err.message || 'Failed to load reports data.');
            } finally {
                setLoadingReports(false);
            }
        };

        fetchReportsData();
    }, []);

    if (loadingReports) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading reports...
            </div>
        );
    }

    if (reportsError) {
        return <div className="text-center py-8 text-red-500">Error: {reportsError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Inventory Analytics & Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                    <span className="text-3xl font-bold text-purple-400 mb-2">{summary.totalProducts}</span>
                    <span className="text-gray-400">Total Products</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                    <span className="text-3xl font-bold text-yellow-400 mb-2">{summary.lowStockCount}</span>
                    <span className="text-gray-400">Low-Stock Items</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                    <span className="text-3xl font-bold text-green-400 mb-2">${summary.inventoryValue.toLocaleString()}</span>
                    <span className="text-gray-400">Inventory Value</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-2">Stock Trends Over Time</h4>
                    <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        {stockTrends.length > 0 ? (
                            <Line
                                data={{
                                    labels: stockTrends.map(d => d.date),
                                    datasets: [
                                        {
                                            label: 'Total Stock',
                                            data: stockTrends.map(d => d.stock),
                                            borderColor: '#a78bfa',
                                            backgroundColor: 'rgba(167,139,250,0.2)',
                                            tension: 0.4,
                                            fill: true,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: {
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            ticks: { color: 'rgba(255,255,255,0.7)' }
                                        },
                                        y: {
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            ticks: { color: 'rgba(255,255,255,0.7)' }
                                        }
                                    }
                                }}
                            />
                        ) : '[No Data]'}
                    </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-2">Top-Selling Products</h4>
                    <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        {topSelling.length > 0 ? (
                            <Bar
                                data={{
                                    labels: topSelling.map(d => d.name),
                                    datasets: [
                                        {
                                            label: 'Units Sold',
                                            data: topSelling.map(d => d.sold),
                                            backgroundColor: '#facc15',
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: {
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            ticks: { color: 'rgba(255,255,255,0.7)' }
                                        },
                                        y: {
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            ticks: { color: 'rgba(255,255,255,0.7)' }
                                        }
                                    }
                                }}
                            />
                        ) : '[No Data]'}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Component for Movement Logs section
function MovementLogsContent({ userRole }) { // <--- MODIFIED: Added userRole prop
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [logError, setLogError] = useState('');

    const [productFilter, setProductFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [distinctUsers, setDistinctUsers] = useState([]);
    const [distinctActions, setDistinctActions] = useState([]);

    useEffect(() => {
        const fetchMovementLogs = async () => {
            setLoadingLogs(true);
            setLogError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLogError('Authentication token not found. Please log in.');
                    setLoadingLogs(false);
                    return;
                }

                const queryParams = new URLSearchParams();
                if (productFilter) queryParams.append('productName', productFilter);
                if (userFilter) queryParams.append('userId', userFilter);
                if (actionFilter) queryParams.append('action', actionFilter);
                if (startDate) queryParams.append('startDate', startDate.toISOString());
                if (endDate) queryParams.append('endDate', endDate.toISOString());

                const url = `https://stockup-l530.onrender.com/api/logs?${queryParams.toString()}`;

                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch movement logs');
                }

                setLogs(data);

                // Extract distinct users and actions from the fetched logs for filter dropdowns
                const currentUsers = [...new Set(data.map(log => log.user?.email || log.user).filter(Boolean))];
                const currentActions = [...new Set(data.map(log => log.action).filter(Boolean))];
                setDistinctUsers(currentUsers);
                setDistinctActions(currentActions);

            } catch (err) {
                console.error('Error fetching movement logs:', err);
                setLogError(err.message || 'Failed to load movement logs. Please try again.');
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchMovementLogs();
    }, [productFilter, userFilter, actionFilter, startDate, endDate, currentUser]);

    const handleApplyFilters = () => {
        console.log("Applying filters (useEffect will handle fetch)");
    };

    // --- NEW EXCEL EXPORT FUNCTION FOR MOVEMENT LOGS ---
    const handleExportLogsExcel = () => {
        if (logs.length === 0) {
            alert("No movement logs to export.");
            return;
        }

        const dataForExcel = logs.map(log => ({
            "Timestamp": new Date(log.createdAt).toLocaleString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false // 24-hour format
            }),
            "Product Name": log.product?.name || 'N/A',
            "Product SKU": log.product?.sku || 'N/A',
            "Action": log.action,
            "Quantity": log.quantity,
            "Old Stock": log.oldStock,
            "New Stock": log.newStock,
            "User Email": log.user?.email || 'N/A',
            "User Name": log.user?.username || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movement Logs");

        const fileName = `stocksense_movement_logs_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(wb, fileName);
    };
    // --- END NEW EXCEL EXPORT FUNCTION ---


    if (loadingLogs && logs.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading movement logs...
            </div>
        );
    }

    if (logError) {
        return <div className="text-center py-8 text-red-500">Error: {logError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Inventory Movement Logs</h3>

            <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-wrap">
                <input
                    type="text"
                    placeholder="Filter by product..."
                    className="flex-1 min-w-[150px] px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                />
                <select
                    className="bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                >
                    <option value="">All Users</option>
                    {distinctUsers.map(user => (
                        <option key={user} value={user}>{user}</option>
                    ))}
                </select>
                <select
                    className="bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                >
                    <option value="">All Actions</option>
                    {distinctActions.map(action => (
                        <option key={action} value={action}>{action}</option>
                    ))}
                </select>

                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
                    dateFormat="yyyy/MM/dd"
                    isClearable
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End Date"
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
                    dateFormat="yyyy/MM/dd"
                    isClearable
                />
                <button
                    onClick={handleApplyFilters}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex-shrink-0"
                    disabled={loadingLogs}
                    type="button"
                >
                    {loadingLogs ? <FaSpinner className="animate-spin mr-2" /> : 'Apply Filters'}
                </button>

                {/* Export to Excel button for Movement Logs - Conditional Rendering for Staff */}
                {userRole === 'admin' && ( // Only show for Admin
                    <button
                        onClick={handleExportLogsExcel}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition flex items-center gap-2"
                        type="button"
                    >
                        Export Excel
                    </button>
                )}
            </div>

            {logs.length === 0 && !loadingLogs ? (
                <div className="text-center py-10 text-gray-400">
                    No movement logs found for the selected criteria.
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Old Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">New Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {logs.map(log => (
                            <tr key={log._id || log.id}>
                                <td className="px-4 py-2 text-sm">
                                    {new Date(log.createdAt).toLocaleString('en-IN', {
                                        year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                                        hour12: false
                                    })}
                                </td>
                                <td className="px-4 py-2 text-sm">{log.product?.name || log.product}</td>
                                <td className="px-4 py-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        log.action === 'Sale' || log.action === 'Delete' ? 'bg-red-500/20 text-red-400' :
                                            log.action === 'Restock' || log.action === 'Create' ? 'bg-green-500/20 text-green-400' :
                                                'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className={`px-4 py-2 text-sm ${log.quantity < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                </td>
                                <td className="px-4 py-2 text-sm">{log.oldStock}</td>
                                <td className="px-4 py-2 text-sm">{log.newStock}</td>
                                <td className="px-4 py-2 text-sm">{log.user?.email || log.user}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}



// --- New User Management Components ---

// UserForm for Add/Edit User Modal
const UserForm = ({ userToEdit, onClose, onUserSaved }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'staff', // Default role
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                username: userToEdit.username || '',
                email: userToEdit.email || '',
                password: '', // Password is never pre-filled for security
                role: userToEdit.role || 'staff',
            });
        }
    }, [userToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        setGeneralError('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required.';
        else if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters.';

        if (!formData.email.trim()) newErrors.email = 'Email is required.';
        else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address.';

        if (!userToEdit && !formData.password.trim()) newErrors.password = 'Password is required for new users.';
        else if (userToEdit && formData.password.trim() && formData.password.trim().length < 6) newErrors.password = 'New password must be at least 6 characters.';


        if (!formData.role) newErrors.role = 'Role is required.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError('Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        const method = userToEdit ? 'PUT' : 'POST';
        const url = userToEdit ? `https://stockup-l530.onrender.com/api/users/${userToEdit._id}` : 'https://stockup-l530.onrender.com/api/users';
        const token = localStorage.getItem('token');

        const payload = {
            username: formData.username,
            email: formData.email,
            role: formData.role,
        };
        if (formData.password) {
            payload.password = formData.password;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                    setGeneralError(data.message || 'Please fix the highlighted errors.');
                } else {
                    setGeneralError(data.message || 'An error occurred while saving the user.');
                }
                throw new Error(data.message || 'Failed to save user');
            }

            onUserSaved(data.user);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <h2 className="text-2xl font-semibold text-white mb-6">
                    {userToEdit ? 'Edit User' : 'Create New User'}
                </h2>
                {generalError && <p className="text-red-500 mb-4 text-center">{generalError}</p>}
                {loading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                        <FaSpinner className="text-purple-400 text-4xl animate-spin" />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.username ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., john_doe"
                            required
                            disabled={loading}
                        />
                        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder="e.g., user@example.com"
                            required
                            disabled={loading}
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-1">
                            {userToEdit ? 'New Password (Optional)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            placeholder={userToEdit ? 'Leave blank to keep current password' : 'Enter password'}
                            required={!userToEdit} // Required only for new users
                            disabled={loading}
                        />
                        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-gray-300 text-sm font-medium mb-1">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 ${errors.role ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            required
                            disabled={loading}
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-medium transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : userToEdit ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// UserManagementContent - Main component for User Management tab
const UserManagementContent = ({ userRole }) => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userError, setUserError] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [showUserForm]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUserError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://stockup-l530.onrender.com/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch users');
            }
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setUserError(err.message || 'Failed to load users. Please try again.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUserClick = () => {
        setUserToEdit(null);
        setShowUserForm(true);
    };

    const handleEditUserClick = (user) => {
        setUserToEdit(user);
        setShowUserForm(true);
    };

    const handleDeleteUser = async (userId, userEmail, userRoleToDelete) => {
        if (currentUser && currentUser._id === userId) {
            alert("You cannot delete your own account while logged in.");
            return;
        }
        if (userRoleToDelete === 'admin') {
            const confirmAdminDelete = window.confirm(`Are you sure you want to delete admin user "${userEmail}"? This action is irreversible and requires at least one admin to remain.`);
            if (!confirmAdminDelete) return;
        } else {
            const confirmDelete = window.confirm(`Are you sure you want to delete user "${userEmail}"?`);
            if (!confirmDelete) return;
        }


        setLoadingUsers(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://stockup-l530.onrender.com/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete user');
            }

            setUsers(users.filter(u => u._id !== userId));
            alert('User deleted successfully!');
        } catch (err) {
            console.error('Error deleting user:', err);
            setUserError(err.message || 'Failed to delete user.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUserSaved = (savedUser) => {
        if (userToEdit) {
            setUsers(users.map(u => u._id === savedUser._id ? savedUser : u));
        } else {
            setUsers([...users, savedUser]);
        }
        fetchUsers();
    };

    if (loadingUsers && users.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Loading users...
            </div>
        );
    }

    if (userError) {
        return <div className="text-center py-8 text-red-500">Error: {userError}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">User Management</h3>
                {userRole === 'admin' && (
                    <button
                        onClick={handleCreateUserClick}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2"
                        type="button"
                    >
                        <FaPlus /> Add New User
                    </button>
                )}
            </div>

            {users.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No users found. Start by adding a new user!</p>
                    {userRole === 'admin' && (
                        <button
                            onClick={handleCreateUserClick}
                            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition flex items-center gap-2 mx-auto"
                            type="button"
                        >
                            <FaPlus /> Add First User
                        </button>
                    )}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                            {userRole === 'admin' && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-700">
                        {users.map(user => (
                            <tr key={user._id}>
                                <td className="px-4 py-2">{user.username}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2 capitalize">{user.role}</td>
                                {userRole === 'admin' && (
                                    <td className="px-4 py-2 flex space-x-2">
                                        <button
                                            onClick={() => handleEditUserClick(user)}
                                            className="text-blue-400 hover:text-blue-600"
                                            title="Edit User"
                                            type="button"
                                            disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1 && currentUser?._id !== user._id}
                                        >
                                            <FaPencilAlt />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id, user.email, user.role)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete User"
                                            type="button"
                                            disabled={currentUser?._id === user._id || (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* User Form Modal */}
            {showUserForm && (
                <UserForm
                    userToEdit={userToEdit}
                    onClose={() => setShowUserForm(false)}
                    onUserSaved={handleUserSaved}
                />
            )}
        </div>
    );
};

// Component for Settings section (Placeholder functionality)

// --- Main Dashboard Component ---
function Dashboard() {
    // activeTab remains 'inventory-products' as the default landing
    const [activeTab, setActiveTab] = useState('inventory-products');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openMenu, setOpenMenu] = useState('');
    const [showWelcomePage, setShowWelcomePage] = useState(true);

    const { currentUser, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !currentUser) {
            navigate('/login');
        }
        const hasVisitedDashboard = sessionStorage.getItem('hasVisitedDashboard');
        if (hasVisitedDashboard) {
            setShowWelcomePage(false);
        }
    }, [currentUser, authLoading, navigate]);

    const userRole = currentUser?.role || 'staff';

    const handleLogout = async () => {
        console.log("Logout button clicked. Attempting to log out..."); // Debugging log
        try {
            await logout(); // Call the logout function provided by AuthContext
            sessionStorage.removeItem('hasVisitedDashboard'); // Clear the flag so welcome page shows next time
            console.log("Client-side logout initiated. AuthContext should handle redirection."); // Further debugging
        } catch (error) {
            console.error('Failed to log out:', error); // Log any errors from AuthContext's logout
            alert('Failed to log out. Please try again.');
        }
    };

    const handleProceedToDashboard = () => {
        setShowWelcomePage(false);
        // When proceeding from welcome, land on 'inventory-products'
        setActiveTab('inventory-products');
        sessionStorage.setItem('hasVisitedDashboard', 'true');
    };

    if (authLoading) { /* ... */ }
    if (!currentUser) { return null; }

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-gray-800 p-4 flex flex-col`}>
                <div className="flex items-center justify-between mb-10">
                    <h1 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 ${!sidebarOpen ? 'opacity-0 scale-x-0 w-0' : 'opacity-100 scale-x-100 w-auto'} transition-all duration-300 origin-left stocksense-logo-flash`}>
                        StockUp
                    </h1>
                    <button
                        onClick={() => {
                            setSidebarOpen((prev) => {
                                if (prev) setOpenMenu('');
                                return !prev;
                            });
                        }}
                        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition"
                        type="button"
                    >
                        {sidebarOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                </div>

                <ul className="space-y-2 flex-grow">
                    {/* REMOVED: Dashboard menu item */}
                    {/* <li className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-200 ${activeTab === 'overview' ? 'bg-gray-700' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab('overview')}>
                        <FaTachometerAlt /> <span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Dashboard</span>
                    </li> */}
                    {/* Inventory menu item */}
                    <li>
                        <div className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-200 ${activeTab.startsWith('inventory-') ? 'bg-gray-700' : 'hover:bg-gray-700'}`} onClick={() => { setOpenMenu(openMenu === 'inventory' ? '' : 'inventory'); setActiveTab('inventory-products'); }}>
                            <FaBoxOpen /> <span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Inventory</span>
                            <span className={`ml-auto transform transition-all duration-300 ${!sidebarOpen ? 'opacity-0' : (activeTab.startsWith('inventory-') || openMenu === 'inventory') ? 'rotate-180' : ''}`}><FaChevronDown /></span>
                        </div>
                        <ul className={`ml-8 overflow-hidden transition-all duration-500 ${activeTab.startsWith('inventory-') || openMenu === 'inventory' ? 'max-h-40' : 'max-h-0'}`}>
                            <li className={`p-1 hover:text-purple-600 cursor-pointer ${activeTab === 'inventory-products' ? 'text-purple-400 font-medium' : ''}`} onClick={() => setActiveTab('inventory-products')}><span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Products</span></li>
                            <li className={`p-1 hover:text-purple-600 cursor-pointer ${activeTab === 'inventory-categories' ? 'text-purple-400 font-medium' : ''}`} onClick={() => setActiveTab('inventory-categories')}><span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Categories</span></li>
                            <li className={`p-1 hover:text-purple-600 cursor-pointer ${activeTab === 'inventory-brands' ? 'text-purple-400 font-medium' : ''}`} onClick={() => setActiveTab('inventory-brands')}><span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Brands</span></li>
                        </ul>
                    </li>
                    <li className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-200 ${activeTab === 'alerts' ? 'bg-gray-700' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab('alerts')}>
                        <FaBell /> <span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Alerts</span>
                    </li>
                    <li>
                        <div className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-200 ${activeTab.startsWith('reports-') ? 'bg-gray-700' : 'hover:bg-gray-700'}`} onClick={() => { setOpenMenu(openMenu === 'reports' ? '' : 'reports'); setActiveTab('reports-analytics'); }}>
                            <FaChartBar /> <span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Reports</span>
                            <span className={`ml-auto transform transition-transform duration-300 ${!sidebarOpen ? 'opacity-0' : openMenu === 'reports' ? 'rotate-180' : ''}`}><FaChevronDown /></span>
                        </div>
                        <ul className={`ml-8 overflow-hidden transition-all duration-500 ${openMenu === 'reports' ? 'max-h-40' : 'max-h-0'}`}>
                            <li className={`p-1 hover:text-purple-600 cursor-pointer ${activeTab === 'reports-analytics' ? 'text-purple-400 font-medium' : ''}`} onClick={() => setActiveTab('reports-analytics')}><span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Analytics</span></li>
                            <li className={`p-1 hover:text-purple-600 cursor-pointer ${activeTab === 'reports-movement' ? 'text-purple-400 font-medium' : ''}`} onClick={() => setActiveTab('reports-movement')}><span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>Movement Logs</span></li>
                        </ul>
                    </li>
                    {userRole === 'admin' && (
                        <li className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-200 ${activeTab === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'}`} onClick={() => setActiveTab('users')}>
                            <FaUsers /> <span className={`${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'} transition-opacity duration-300`}>User Management</span>
                        </li>
                    )}

                </ul>

                <div className={`mt-auto pt-4 border-t border-gray-700 ${!sidebarOpen ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'} transition-opacity duration-300`}>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-gray-700">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                            {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{currentUser?.email || 'Guest User'}</p>
                            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition"
                        type="button"
                    >
                        Log Out
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <header className="bg-gray-800 shadow-md py-4 px-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">

                            {activeTab === 'inventory-products' && 'Product Dashboard'}
                            {activeTab === 'inventory-categories' && 'Inventory Categories'}
                            {activeTab === 'inventory-brands' && 'Inventory Brands'}
                            {activeTab === 'alerts' && 'Low-Stock Alerts'}
                            {activeTab === 'reports-analytics' && 'Inventory Analytics'}
                            {activeTab === 'reports-movement' && 'Movement Logs'}
                            {activeTab === 'users' && 'User Management'}

                        </h2>
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-700 rounded-md p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></div>
                            <div className="bg-gray-700 rounded-md p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg></div>
                            <div className="bg-gray-700 rounded-md p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></div>
                        </div>
                    </div>
                </header>

                <main className="p-6">
                    {/* Conditional rendering for WelcomePageContent */}
                    {showWelcomePage ? (
                        <WelcomePageContent
                            currentUser={currentUser}
                            onProceedToDashboard={handleProceedToDashboard}
                        />
                    ) : (
                        // Original main content rendering when not on welcome page
                        <>

                            {activeTab === 'inventory-products' && <ProductDashboardContent userRole={userRole} />}
                            {activeTab === 'inventory-categories' && <CategoryContent userRole={userRole} />}
                            {activeTab === 'inventory-brands' && <BrandContent userRole={userRole} />}
                            {activeTab === 'alerts' && <AlertsContent userRole={userRole} />}
                            {activeTab === 'reports-analytics' && <ReportsContent />}
                            {activeTab === 'reports-movement' && <MovementLogsContent userRole={userRole} />}
                            {activeTab === 'users' && userRole === 'admin' && (
                                <UserManagementContent userRole={userRole} />
                            )}

                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Dashboard;
