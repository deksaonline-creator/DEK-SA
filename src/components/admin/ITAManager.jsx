import React, { useState } from 'react';
import { saveIta, deleteIta } from '../../store/mockDb';
import { Plus, Trash2, Edit, Save, X, Link as LinkIcon } from 'lucide-react';

const ITAManager = ({ itas, refreshData }) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Category Form
  const [categoryName, setCategoryName] = useState('');
  
  // Item Form
  const [newItemCategory, setNewItemCategory] = useState(null);
  const [newItemId, setNewItemId] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemLink, setNewItemLink] = useState('');

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return alert('กรุณากรอกชื่อหมวดหมู่');
    
    await saveIta({
      id: `ita-cat-${Date.now()}`,
      category: categoryName,
      items: []
    });
    
    setCategoryName('');
    setIsCreating(false);
    refreshData();
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? (ตัวชี้วัดทั้งหมดในนี้จะหายไป)')) {
      await deleteIta(id);
      refreshData();
    }
  };

  const handleAddItem = async (cat) => {
    if (!newItemId.trim() || !newItemTitle.trim() || !newItemLink.trim()) {
      return alert('กรุณากรอกข้อมูลตัวชี้วัดให้ครบถ้วน');
    }

    const updatedCategory = { ...cat };
    if (!updatedCategory.items) updatedCategory.items = [];
    
    updatedCategory.items.push({
      id: newItemId,
      title: newItemTitle,
      link: newItemLink
    });

    await saveIta(updatedCategory);
    setNewItemCategory(null);
    setNewItemId('');
    setNewItemTitle('');
    setNewItemLink('');
    refreshData();
  };

  const handleDeleteItem = async (cat, itemIndex) => {
    if (window.confirm('ลบตัวชี้วัดนี้หรือไม่?')) {
      const updatedCategory = { ...cat };
      updatedCategory.items.splice(itemIndex, 1);
      await saveIta(updatedCategory);
      refreshData();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการข้อมูลการประเมิน ITA</h2>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={18} /> เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      {isCreating && (
        <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #27272a', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#60a5fa' }}>เพิ่มหมวดหมู่ ITA ใหม่</h3>
          <input 
            type="text" 
            className="input-field" 
            placeholder="ชื่อหมวดหมู่ เช่น ข้อมูลพื้นฐาน, การบริหารงาน" 
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSaveCategory}><Save size={18} /> บันทึก</button>
            <button className="btn btn-secondary" onClick={() => setIsCreating(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {itas.length === 0 && !isCreating ? (
        <div style={{ background: '#18181b', padding: '3rem', borderRadius: '1rem', textAlign: 'center', color: '#a1a1aa' }}>
          <p>ยังไม่มีข้อมูลหมวดหมู่ ITA</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {itas.map(cat => (
            <div key={cat.id} style={{ background: '#18181b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{cat.category}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setNewItemCategory(cat.id)}>
                    <Plus size={16} /> เพิ่มตัวชี้วัด (OIT)
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ef4444' }} onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 size={16} /> ลบหมวดหมู่นี้
                  </button>
                </div>
              </div>

              {/* Add Item Form */}
              {newItemCategory === cat.id && (
                <div style={{ background: '#09090b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" className="input-field" placeholder="รหัสตัวชี้วัด (เช่น OIT1)" value={newItemId} onChange={e => setNewItemId(e.target.value)} />
                    <input type="text" className="input-field" placeholder="ชื่อตัวชี้วัด (เช่น โครงสร้างหน่วยงาน)" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                    <input type="text" className="input-field" placeholder="ลิงก์ URL (เช่น https://...)" value={newItemLink} onChange={e => setNewItemLink(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleAddItem(cat)}><Save size={16} /> บันทึก</button>
                    <button className="btn btn-secondary" onClick={() => setNewItemCategory(null)}>ยกเลิก</button>
                  </div>
                </div>
              )}

              {/* Items List */}
              {(!cat.items || cat.items.length === 0) ? (
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>ยังไม่มีตัวชี้วัดในหมวดหมู่นี้</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cat.items.map((item, idx) => (
                    <div key={idx} style={{ background: '#27272a', padding: '1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.25rem' }}>{item.id}</div>
                        <div>{item.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <LinkIcon size={12} /> <a href={item.link} target="_blank" rel="noreferrer" style={{ color: '#a1a1aa' }}>{item.link}</a>
                        </div>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ef4444' }} onClick={() => handleDeleteItem(cat, idx)}>
                        <Trash2 size={16} /> ลบ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ITAManager;
