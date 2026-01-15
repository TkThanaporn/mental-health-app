import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewsManagement = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const getCategories = async () => {
            const res = await axios.get('http://localhost:5000/api/news/categories');
            setCategories(res.data);
        };
        getCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/news', {
                title, content, category_id: categoryId, author_id: 2 // หรือดึงจาก AuthContext
            });
            alert('ประกาศข่าวสารเรียบร้อยแล้ว');
            setTitle(''); setContent('');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="container mt-4">
            <h2 className="text-primary mb-4">จัดการข่าวสาร</h2>
            <form onSubmit={handleSubmit} className="card p-4 shadow">
                <input type="text" className="form-control mb-3" placeholder="หัวข้อข่าว" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <select className="form-select mb-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
                <textarea className="form-control mb-3" rows="5" placeholder="เนื้อหา" value={content} onChange={(e) => setContent(e.target.value)} required />
                <button className="btn btn-success w-100">บันทึกและประกาศ</button>
            </form>
        </div>
    );
};

export default NewsManagement;