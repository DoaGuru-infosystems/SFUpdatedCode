import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    FaProjectDiagram, FaLayerGroup, FaTags, FaPlusCircle,
    FaArrowRight, FaCube, FaObjectGroup, FaCheckCircle
} from 'react-icons/fa';

const AddData = () => {
    const [projectName, setProjectName] = useState('');
    const [projectDepartment, setProjectDepartment] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [subCategoryName, setSubCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [loading, setLoading] = useState({ project: false, category: false, subcategory: false });

    const fetchCategories = () => {
        axios.get('http://localhost:8080/api/category-list')
            .then(response => {
                setCategories(response.data);
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
            });
    };

    const handleAddProject = async () => {
        if (!projectName.trim()) return toast.error("Please enter a project name");
        if (projectDepartment.length === 0) return toast.error("Please select at least one department");
        setLoading(prev => ({ ...prev, project: true }));
        try {
            await axios.post('http://localhost:8080/api/projects', { name: projectName, department: projectDepartment.join(', ') });
            toast.success('Project registered successfully');
            setProjectName('');
            setProjectDepartment([]);
        } catch (error) {
            toast.error('Failed to add project');
        } finally {
            setLoading(prev => ({ ...prev, project: false }));
        }
    };

    const handleAddCategory = async () => {
        if (!categoryName.trim()) return toast.error("Please enter a category name");
        setLoading(prev => ({ ...prev, category: true }));
        try {
            await axios.post('http://localhost:8080/api/categories', { name: categoryName });
            toast.success('Category created successfully');
            setCategoryName('');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to create category');
        } finally {
            setLoading(prev => ({ ...prev, category: false }));
        }
    };

    const handleAddSubCategory = async () => {
        if (!subCategoryName.trim()) return toast.error("Please enter a subcategory name");
        if (!selectedCategoryId) return toast.error("Please select a parent category");
        setLoading(prev => ({ ...prev, subcategory: true }));
        try {
            await axios.post('http://localhost:8080/api/subcategories', { name: subCategoryName, category_id: selectedCategoryId });
            toast.success('Sub-category linked successfully');
            setSubCategoryName('');
            setSelectedCategoryId('');
        } catch (error) {
            toast.error('Failed to link sub-category');
        } finally {
            setLoading(prev => ({ ...prev, subcategory: false }));
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const cards = [
        {
            title: "Register Project",
            desc: "Add a main project entity to the database",
            icon: <FaProjectDiagram />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            value: projectName,
            setter: setProjectName,
            handler: handleAddProject,
            loading: loading.project,
            placeholder: "Project Name (e.g. Sales Funnel v2)",
            showDepartmentSelect: true
        },
        {
            title: "Create Category",
            desc: "Define a root category for organizational logic",
            icon: <FaLayerGroup />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            value: categoryName,
            setter: setCategoryName,
            handler: handleAddCategory,
            loading: loading.category,
            placeholder: "Category Name (e.g. Frontend Development)"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100/20 border border-slate-100">
                            <FaPlusCircle size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Expand Taxonomy</h1>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Register New Projects & Classification Logic</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cards.map((card, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/20 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                                    {card.icon}
                                </div>
                                <FaCube className="text-slate-100" size={30} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-1">{card.title}</h2>
                            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed uppercase tracking-tighter">{card.desc}</p>

                            <div className="space-y-4">
                                {card.showDepartmentSelect && (
                                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-100">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Departments</label>
                                        <div className="flex flex-wrap gap-4">
                                            {["Development", "Digital Marketing", "SEO", "Management", "Sales"].map(dept => (
                                                <label key={dept} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-indigo-600 w-4 h-4"
                                                        checked={projectDepartment.includes(dept.toLowerCase())}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setProjectDepartment([...projectDepartment, dept.toLowerCase()]);
                                                            } else {
                                                                setProjectDepartment(projectDepartment.filter(d => d !== dept.toLowerCase()));
                                                            }
                                                        }}
                                                    />
                                                    {dept}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-xs font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300"
                                        type="text"
                                        value={card.value}
                                        onChange={(e) => card.setter(e.target.value)}
                                        placeholder={card.placeholder}
                                    />
                                    {card.value && !card.showDepartmentSelect && <FaCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 animate-in fade-in zoom-in" size={14} />}
                                </div>
                                <button
                                    className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group/btn"
                                    onClick={card.handler}
                                    disabled={card.loading}
                                >
                                    {card.loading ? "PROCESSING..." : (
                                        <><span>SUBMIT RECORD</span> <FaArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Sub-Category Card (Full Width) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-1 rounded-[2.5rem] shadow-2xl shadow-indigo-200"
                >
                    <div className="bg-slate-900/40 rounded-[2.3rem] p-8 md:p-12 flex flex-col lg:flex-row gap-12 items-center">
                        <div className="lg:w-1/2 space-y-6">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                                <FaObjectGroup size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Refine Sub-Categories</h2>
                                <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-md opacity-80 uppercase tracking-tight">Link specialized sub-components to their parent classification for granular project tracking.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black tracking-widest uppercase">Select Parent</div>
                                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black tracking-widest uppercase">Name Registry</div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 ml-1">Parent Category</label>
                                <select
                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                >
                                    <option value="" className="text-slate-900">Select Parent Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id} className="text-slate-900">
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 ml-1">Sub-Category Title</label>
                                <input
                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-indigo-200/40"
                                    type="text"
                                    value={subCategoryName}
                                    onChange={(e) => setSubCategoryName(e.target.value)}
                                    placeholder="Enter Title..."
                                />
                            </div>

                            <button
                                className="w-full bg-white text-indigo-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 shadow-xl transition-all flex items-center justify-center gap-2 mt-4"
                                onClick={handleAddSubCategory}
                                disabled={loading.subcategory}
                            >
                                {loading.subcategory ? "PROCESSING..." : (
                                    <><span>LINK SUB-CATEGORY</span> <FaTags size={14} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AddData;
