

import React, { useState, useMemo } from 'react';
import { ConfigItem } from '../types';
import { ICONS } from '../constants';
import { useSystem } from '../contexts/SystemContext';

// --- Types ---
interface ModuleDefinition {
    id: string;
    label: string;
    icon: any;
    categories: {
        id: ConfigItem['category'];
        label: string;
        needsParent?: boolean;
        parentCategory?: ConfigItem['category'];
    }[];
}

// --- Configuration ---
const CONFIG_MODULES: ModuleDefinition[] = [
    {
        id: 'STUDENT',
        label: '學生資料管理',
        icon: ICONS.Students,
        categories: [
            { id: 'DEPT', label: '系所單位 (DEPT)' },
            { id: 'ADMISSION_CHANNEL', label: '入學管道' },
            { id: 'TRIBE', label: '原住民族別 (TRIBE)' },
            { id: 'LANGUAGE_DIALECT', label: '族語方言 (DIALECT)' },
            { id: 'LANGUAGE_LEVEL', label: '語言級別' },
            { id: 'SUSPENSION_REASON', label: '休學原因' },
            { id: 'DROPOUT_REASON', label: '退學原因' },
        ]
    },
    {
        id: 'LOCATION',
        label: '地理位置設定',
        icon: ICONS.MapPin,
        categories: [
            { id: 'INDIGENOUS_CITY', label: '原鄉-縣市 (CITY)' },
            { id: 'INDIGENOUS_DISTRICT', label: '原鄉-鄉鎮 (DISTRICT)', needsParent: true, parentCategory: 'INDIGENOUS_CITY' },
        ]
    },
    {
        id: 'COUNSEL',
        label: '輔導關懷紀錄',
        icon: ICONS.Counseling,
        categories: [
            { id: 'COUNSEL_METHOD', label: '進行方式' },
            { id: 'COUNSEL_CATEGORY', label: '諮詢類別' },
            { id: 'COUNSEL_RECOMMENDATION', label: '後續建議' },
        ]
    },
    {
        id: 'SCHOLARSHIP',
        label: '獎助學金管理',
        icon: ICONS.Financial,
        categories: [
            { id: 'SCHOLARSHIP_NAME', label: '獎助項目名稱' },
        ]
    }
];

const COLORS = [
    { value: 'blue', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', class: 'bg-green-100 text-green-800' },
    { value: 'red', class: 'bg-red-100 text-red-800' },
    { value: 'yellow', class: 'bg-yellow-100 text-yellow-800' },
    { value: 'gray', class: 'bg-gray-100 text-gray-800' },
    { value: 'purple', class: 'bg-purple-100 text-purple-800' },
];

export const SystemConfig: React.FC = () => {
  const { configs, setConfigs } = useSystem();
  
  // Navigation State
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  
  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ConfigItem> | null>(null);

  // Derived State
  const activeModule = CONFIG_MODULES[activeModuleIndex];
  const activeCategoryDef = activeModule.categories[activeCategoryIndex];
  const activeCategoryId = activeCategoryDef.id;

  // Filter Configs
  const currentConfigs = useMemo(() => {
      return configs
        .filter(c => c.category === activeCategoryId)
        .sort((a,b) => a.order - b.order);
  }, [configs, activeCategoryId]);

  // Logic for Parent Options (e.g. Get all Cities when adding a District)
  const parentOptions = useMemo(() => {
      if (activeCategoryDef.needsParent && activeCategoryDef.parentCategory) {
          return configs
            .filter(c => c.category === activeCategoryDef.parentCategory && c.isActive)
            .sort((a, b) => a.order - b.order);
      }
      return [];
  }, [configs, activeCategoryDef]);

  const handleOpenAdd = () => {
      setEditingItem({
          category: activeCategoryId,
          isActive: true,
          order: currentConfigs.length + 1,
          color: 'gray'
      });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ConfigItem) => {
      setEditingItem({...item});
      setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingItem?.code || !editingItem?.label) {
        alert("請填寫代碼與名稱");
        return;
    }
    if (activeCategoryDef.needsParent && !editingItem.parentCode) {
        alert("此項目需選擇上層分類 (如: 所屬縣市)");
        return;
    }

    if (editingItem.id) {
        // Edit Existing
        setConfigs(prev => prev.map(c => c.id === editingItem.id ? editingItem as ConfigItem : c));
    } else {
        // Create New
        const newItem: ConfigItem = {
            ...editingItem as ConfigItem,
            id: Math.random().toString(36).substr(2, 9),
            code: editingItem.code!.toUpperCase(),
        };
        setConfigs(prev => [...prev, newItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
      if (confirm('確定要刪除此項目嗎？')) {
          setConfigs(prev => prev.filter(c => c.id !== id));
      }
  };

  const toggleStatus = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const getParentLabel = (parentCode?: string) => {
      if (!parentCode || !activeCategoryDef.parentCategory) return '-';
      const parent = configs.find(c => c.category === activeCategoryDef.parentCategory && c.code === parentCode);
      return parent ? parent.label : parentCode;
  };

  return (
    <div className="flex h-full bg-gray-50 gap-0 overflow-hidden rounded-lg shadow-sm border border-gray-200">
      
      {/* Sidebar: Modules */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <ICONS.Settings className="text-isu-dark" size={20}/> 參數設定中心
              </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
              {CONFIG_MODULES.map((module, mIdx) => (
                  <div key={module.id} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => { setActiveModuleIndex(mIdx); setActiveCategoryIndex(0); }}
                        className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${activeModuleIndex === mIdx ? 'bg-blue-50 text-blue-800 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                          <module.icon size={18} className={activeModuleIndex === mIdx ? 'text-blue-600' : 'text-gray-400'}/>
                          <span className="font-bold text-sm">{module.label}</span>
                      </button>
                      
                      {activeModuleIndex === mIdx && (
                          <div className="bg-gray-50 py-2">
                              {module.categories.map((cat, cIdx) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryIndex(cIdx)}
                                    className={`w-full text-left pl-12 pr-4 py-2 text-xs font-medium transition-colors ${activeCategoryIndex === cIdx ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                  >
                                      {cat.label}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
              <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {activeCategoryDef.label}
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">共 {currentConfigs.length} 筆</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">管理系統下拉選單與標籤選項</p>
              </div>
              <button onClick={handleOpenAdd} className="bg-isu-dark text-white px-4 py-2 rounded text-sm hover:bg-gray-800 flex items-center gap-2 shadow-sm">
                  <ICONS.Plus size={16} /> 新增項目
              </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0 z-10">
                          <tr>
                              <th className="px-4 py-3 w-16 text-center">排序</th>
                              {activeCategoryDef.needsParent && <th className="px-4 py-3 w-48">上層分類</th>}
                              <th className="px-4 py-3 w-24 text-center">標籤色</th>
                              <th className="px-4 py-3 w-32">代碼</th>
                              <th className="px-4 py-3">名稱</th>
                              <th className="px-4 py-3 w-1/3">備註</th>
                              <th className="px-4 py-3 w-24 text-center">狀態</th>
                              <th className="px-4 py-3 w-32 text-right">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {currentConfigs.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                  <td className="px-4 py-3 text-center text-gray-400 font-mono">{item.order}</td>
                                  {activeCategoryDef.needsParent && (
                                      <td className="px-4 py-3 text-gray-600 font-medium bg-gray-50/50">
                                          {getParentLabel(item.parentCode)}
                                      </td>
                                  )}
                                  <td className="px-4 py-3 text-center">
                                      <div className={`w-4 h-4 rounded-full mx-auto ${COLORS.find(c => c.value === item.color)?.class.split(' ')[0] || 'bg-gray-200'}`}></div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-gray-600 font-medium text-xs">{item.code}</td>
                                  <td className="px-4 py-3 text-gray-800 font-bold">
                                      {item.label}
                                      {item.isSystemDefault && <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded border border-gray-300">系統預設</span>}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 text-xs">{item.description || '-'}</td>
                                  <td className="px-4 py-3 text-center">
                                      <button onClick={() => toggleStatus(item.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                      </button>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleOpenEdit(item)} className="text-gray-500 hover:text-blue-600 p-1"><ICONS.Edit size={16} /></button>
                                          {!item.isSystemDefault && (
                                              <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600 p-1"><ICONS.Close size={16} /></button>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {currentConfigs.length === 0 && (
                              <tr><td colSpan={8} className="p-12 text-center text-gray-400 italic">此類別尚無設定資料</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && editingItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">{editingItem.id ? '編輯項目' : '新增項目'} - {activeCategoryDef.label}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><ICONS.Close size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      {activeCategoryDef.needsParent && (
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">上層分類 (Parent)</label>
                              <select 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={editingItem.parentCode || ''}
                                onChange={e => setEditingItem({...editingItem, parentCode: e.target.value})}
                              >
                                  <option value="">請選擇...</option>
                                  {parentOptions.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                              </select>
                          </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">代碼 (Code)</label>
                              <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm font-mono" value={editingItem.code || ''} onChange={e => setEditingItem({...editingItem, code: e.target.value})} placeholder="e.g. CODE" disabled={!!editingItem.id && editingItem.isSystemDefault} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">排序 (Order)</label>
                              <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={editingItem.order || 0} onChange={e => setEditingItem({...editingItem, order: Number(e.target.value)})} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">名稱 (Label)</label>
                          <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm" value={editingItem.label || ''} onChange={e => setEditingItem({...editingItem, label: e.target.value})} placeholder="顯示名稱" />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">備註說明 (Description)</label>
                          <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="選填..." />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-2">標籤顏色</label>
                          <div className="flex gap-2">
                              {COLORS.map(c => (
                                  <button
                                    key={c.value}
                                    onClick={() => setEditingItem({...editingItem, color: c.value})}
                                    className={`w-8 h-8 rounded-full border-2 ${c.class.split(' ')[0]} ${editingItem.color === c.value ? 'border-gray-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-200 text-sm">取消</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">儲存設定</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};