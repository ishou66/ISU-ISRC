
import React, { useState, useMemo } from 'react';
import { ConfigItem, ScholarshipConfig } from '../types';
import { ICONS } from '../constants';
import { useSystem } from '../contexts/SystemContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useAuth } from '../contexts/AuthContext';
import { RoleManager } from './RoleManager';
import { ResizableHeader } from './ui/ResizableHeader';

// --- Types ---
type ConfigCategory = 'BUSINESS' | 'INTERFACE' | 'PROCESS';

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

// --- Configuration for INTERFACE Settings ---
const CONFIG_MODULES: ModuleDefinition[] = [
    {
        id: 'STUDENT',
        label: '學生資料選項',
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
        label: '地理位置選項',
        icon: ICONS.MapPin,
        categories: [
            { id: 'INDIGENOUS_CITY', label: '原鄉-縣市 (CITY)' },
            { id: 'INDIGENOUS_DISTRICT', label: '原鄉-鄉鎮 (DISTRICT)', needsParent: true, parentCategory: 'INDIGENOUS_CITY' },
        ]
    },
    {
        id: 'COUNSEL',
        label: '輔導紀錄選項',
        icon: ICONS.Counseling,
        categories: [
            { id: 'COUNSEL_METHOD', label: '進行方式' },
            { id: 'COUNSEL_CATEGORY', label: '諮詢類別' },
            { id: 'COUNSEL_RECOMMENDATION', label: '後續建議' },
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
  const { configs, setConfigs, workflowSteps, setWorkflowSteps } = useSystem();
  const { scholarshipConfigs, setScholarshipConfigs } = useScholarships();
  const { roles } = useAuth();
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('BUSINESS');
  
  // Interface Settings State
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeSubCategoryIndex, setActiveSubCategoryIndex] = useState(0);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfigItem, setEditingConfigItem] = useState<Partial<ConfigItem> | null>(null);

  // Business Logic State (Scholarship)
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Partial<ScholarshipConfig>>({});

  // Process Logic State
  const [activeProcessTab, setActiveProcessTab] = useState<'WORKFLOW' | 'ROLES'>('ROLES');

  // Derived State for Interface Settings
  const activeModule = CONFIG_MODULES[activeModuleIndex];
  const activeSubCategoryDef = activeModule.categories[activeSubCategoryIndex];
  const activeSubCategoryId = activeSubCategoryDef?.id;

  const currentConfigs = useMemo(() => {
      if (!activeSubCategoryId) return [];
      return configs
        .filter(c => c.category === activeSubCategoryId)
        .sort((a,b) => a.order - b.order);
  }, [configs, activeSubCategoryId]);

  const parentOptions = useMemo(() => {
      if (activeSubCategoryDef?.needsParent && activeSubCategoryDef.parentCategory) {
          return configs
            .filter(c => c.category === activeSubCategoryDef.parentCategory && c.isActive)
            .sort((a, b) => a.order - b.order);
      }
      return [];
  }, [configs, activeSubCategoryDef]);

  // --- Handlers: Interface Settings ---
  const handleConfigSave = () => {
    if (!editingConfigItem?.code || !editingConfigItem?.label) { alert("請填寫代碼與名稱"); return; }
    if (activeSubCategoryDef.needsParent && !editingConfigItem.parentCode) { alert("此項目需選擇上層分類"); return; }

    if (editingConfigItem.id) {
        setConfigs(prev => prev.map(c => c.id === editingConfigItem.id ? editingConfigItem as ConfigItem : c));
    } else {
        const newItem: ConfigItem = {
            ...editingConfigItem as ConfigItem,
            id: Math.random().toString(36).substr(2, 9),
            code: editingConfigItem.code!.toUpperCase(),
        };
        setConfigs(prev => [...prev, newItem]);
    }
    setIsConfigModalOpen(false);
    setEditingConfigItem(null);
  };

  // --- Handlers: Scholarship Settings ---
  const handleScholarshipSave = () => {
      if (!editingScholarship.name || !editingScholarship.semester) { alert('請填寫完整資料'); return; }
      const newConfig: ScholarshipConfig = {
          id: editingScholarship.id || `sc_${Math.random().toString(36).substr(2,9)}`,
          semester: editingScholarship.semester!,
          name: editingScholarship.name!,
          category: editingScholarship.category || 'FINANCIAL_AID',
          amount: Number(editingScholarship.amount || 0),
          serviceHoursRequired: Number(editingScholarship.serviceHoursRequired || 0),
          isActive: editingScholarship.isActive ?? true
      };
      
      const updatedConfigs = editingScholarship.id 
          ? scholarshipConfigs.map(c => c.id === newConfig.id ? newConfig : c)
          : [...scholarshipConfigs, newConfig];
      
      setScholarshipConfigs(updatedConfigs);
      setIsScholarshipModalOpen(false);
  };

  // --- Render Helpers ---
  const renderSidebar = () => (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.Settings size={20}/> 參數設定</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
              <button onClick={() => setActiveCategory('BUSINESS')} className={`w-full text-left px-5 py-3 border-b border-gray-100 font-bold flex items-center gap-2 ${activeCategory === 'BUSINESS' ? 'bg-blue-50 text-blue-800 border-r-4 border-r-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <ICONS.Briefcase size={18}/> (A) 業務邏輯設定
              </button>
              <button onClick={() => setActiveCategory('INTERFACE')} className={`w-full text-left px-5 py-3 border-b border-gray-100 font-bold flex items-center gap-2 ${activeCategory === 'INTERFACE' ? 'bg-blue-50 text-blue-800 border-r-4 border-r-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <ICONS.Menu size={18}/> (B) 介面與選項
              </button>
              <button onClick={() => setActiveCategory('PROCESS')} className={`w-full text-left px-5 py-3 border-b border-gray-100 font-bold flex items-center gap-2 ${activeCategory === 'PROCESS' ? 'bg-blue-50 text-blue-800 border-r-4 border-r-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <ICONS.Security size={18}/> (C) 流程與權限
              </button>
          </div>
      </div>
  );

  // --- CONTENT: A. Business Logic ---
  const renderBusinessLogic = () => (
      <div className="p-6 space-y-8">
          {/* Section 1: Scholarship Rules */}
          <div>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 border-l-4 border-isu-red pl-3">獎助學金規則設定</h3>
                  <button onClick={() => { setEditingScholarship({ isActive: true, category: 'FINANCIAL_AID' }); setIsScholarshipModalOpen(true); }} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-2"><ICONS.Plus size={16}/> 新增項目</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            <ResizableHeader className="p-3 w-20">學期</ResizableHeader>
                            <ResizableHeader className="p-3">項目名稱</ResizableHeader>
                            <ResizableHeader className="p-3 w-20">類別</ResizableHeader>
                            <ResizableHeader className="p-3 w-20">金額</ResizableHeader>
                            <ResizableHeader className="p-3 w-20">時數要求</ResizableHeader>
                            <ResizableHeader className="p-3 w-20">狀態</ResizableHeader>
                            <ResizableHeader className="p-3 text-right w-20">操作</ResizableHeader>
                        </tr>
                      </thead>
                      <tbody>
                          {scholarshipConfigs.map(conf => (
                              <tr key={conf.id} className="border-t hover:bg-gray-50">
                                  <td className="p-3">{conf.semester}</td>
                                  <td className="p-3 font-bold">{conf.name}</td>
                                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs border ${conf.category === 'SCHOLARSHIP' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{conf.category === 'SCHOLARSHIP' ? '獎學金' : '助學金'}</span></td>
                                  <td className="p-3">${conf.amount.toLocaleString()}</td>
                                  <td className="p-3">{conf.serviceHoursRequired} hr</td>
                                  <td className="p-3"><span className={`w-2 h-2 rounded-full inline-block mr-2 ${conf.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>{conf.isActive ? '啟用' : '停用'}</td>
                                  <td className="p-3 text-right"><button onClick={() => { setEditingScholarship(conf); setIsScholarshipModalOpen(true); }} className="text-gray-500 hover:text-blue-600"><ICONS.Edit size={16}/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Section 2: Activity Rules (Simple Mock) */}
          <div>
              <h3 className="text-xl font-bold text-gray-800 border-l-4 border-isu-red pl-3 mb-4">活動規則設定 (全域預設)</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg">
                  <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700">預設服務時數 (簽到)</label>
                      <input type="number" className="border rounded p-2 w-20 text-center" defaultValue={2} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">此設定將作為新建立活動時的預設值，個別活動仍可調整。</p>
              </div>
          </div>

          {/* Modal: Scholarship Edit */}
          {isScholarshipModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                      <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">編輯補助項目</h3><button onClick={() => setIsScholarshipModalOpen(false)}><ICONS.Close/></button></div>
                      <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1">學期</label><input className="w-full border rounded p-2" value={editingScholarship.semester || ''} onChange={e => setEditingScholarship({...editingScholarship, semester: e.target.value})} placeholder="112-1" /></div>
                              <div><label className="block text-xs font-bold mb-1">類別</label><select className="w-full border rounded p-2" value={editingScholarship.category} onChange={e => setEditingScholarship({...editingScholarship, category: e.target.value as any})}><option value="FINANCIAL_AID">助學金</option><option value="SCHOLARSHIP">獎學金</option></select></div>
                          </div>
                          <div><label className="block text-xs font-bold mb-1">項目名稱</label><input className="w-full border rounded p-2" value={editingScholarship.name || ''} onChange={e => setEditingScholarship({...editingScholarship, name: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1">金額</label><input type="number" className="w-full border rounded p-2" value={editingScholarship.amount} onChange={e => setEditingScholarship({...editingScholarship, amount: Number(e.target.value)})} /></div>
                              <div><label className="block text-xs font-bold mb-1">時數要求</label><input type="number" className="w-full border rounded p-2" value={editingScholarship.serviceHoursRequired} onChange={e => setEditingScholarship({...editingScholarship, serviceHoursRequired: Number(e.target.value)})} /></div>
                          </div>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={editingScholarship.isActive} onChange={e => setEditingScholarship({...editingScholarship, isActive: e.target.checked})} /> 啟用</label>
                      </div>
                      <div className="p-4 border-t flex justify-end gap-2"><button onClick={() => setIsScholarshipModalOpen(false)} className="border px-4 py-2 rounded">取消</button><button onClick={handleScholarshipSave} className="bg-primary text-white px-4 py-2 rounded">儲存</button></div>
                  </div>
              </div>
          )}
      </div>
  );

  // --- CONTENT: B. Interface Settings ---
  const renderInterfaceSettings = () => (
      <div className="flex h-full">
          {/* Sub Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto">
              {CONFIG_MODULES.map((mod, idx) => (
                  <div key={mod.id} className="mb-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">{mod.label}</h4>
                      {mod.categories.map((cat, cIdx) => (
                          <button key={cat.id} onClick={() => { setActiveModuleIndex(idx); setActiveSubCategoryIndex(cIdx); }} className={`w-full text-left px-3 py-2 text-sm rounded ${activeModuleIndex === idx && activeSubCategoryIndex === cIdx ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}>
                              {cat.label}
                          </button>
                      ))}
                  </div>
              ))}
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{activeSubCategoryDef.label}</h3>
                  <button onClick={() => { setEditingConfigItem({ category: activeSubCategoryId, isActive: true, order: currentConfigs.length + 1, color: 'gray' }); setIsConfigModalOpen(true); }} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-2"><ICONS.Plus size={16}/> 新增選項</button>
              </div>
              <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            <ResizableHeader className="p-3 w-16">排序</ResizableHeader>
                            {activeSubCategoryDef.needsParent && <ResizableHeader className="p-3">上層</ResizableHeader>}
                            <ResizableHeader className="p-3 w-20">標籤</ResizableHeader>
                            <ResizableHeader className="p-3">代碼</ResizableHeader>
                            <ResizableHeader className="p-3">名稱</ResizableHeader>
                            <ResizableHeader className="p-3 text-right">操作</ResizableHeader>
                        </tr>
                      </thead>
                      <tbody>
                          {currentConfigs.map(item => (
                              <tr key={item.id} className="border-t hover:bg-gray-50 group">
                                  <td className="p-3 text-gray-400">{item.order}</td>
                                  {activeSubCategoryDef.needsParent && <td className="p-3 text-gray-500">{configs.find(c => c.code === item.parentCode && c.category === activeSubCategoryDef.parentCategory)?.label || '-'}</td>}
                                  <td className="p-3"><div className={`w-4 h-4 rounded-full ${COLORS.find(c=>c.value===item.color)?.class.split(' ')[0]}`}></div></td>
                                  <td className="p-3 font-mono text-gray-600">{item.code}</td>
                                  <td className="p-3 font-bold">{item.label}</td>
                                  <td className="p-3 text-right"><button onClick={() => { setEditingConfigItem(item); setIsConfigModalOpen(true); }} className="text-gray-400 hover:text-blue-600"><ICONS.Edit size={16}/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
          {/* Interface Config Modal */}
          {isConfigModalOpen && editingConfigItem && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                      <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">選項設定</h3><button onClick={() => setIsConfigModalOpen(false)}><ICONS.Close/></button></div>
                      <div className="p-6 space-y-3">
                          {activeSubCategoryDef.needsParent && (
                              <div><label className="block text-xs font-bold mb-1">上層分類</label><select className="w-full border rounded p-2" value={editingConfigItem.parentCode || ''} onChange={e => setEditingConfigItem({...editingConfigItem, parentCode: e.target.value})}><option value="">請選擇...</option>{parentOptions.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}</select></div>
                          )}
                          <div><label className="block text-xs font-bold mb-1">代碼 (Code)</label><input className="w-full border rounded p-2" value={editingConfigItem.code || ''} onChange={e => setEditingConfigItem({...editingConfigItem, code: e.target.value})} disabled={!!editingConfigItem.id && editingConfigItem.isSystemDefault}/></div>
                          <div><label className="block text-xs font-bold mb-1">顯示名稱 (Label)</label><input className="w-full border rounded p-2" value={editingConfigItem.label || ''} onChange={e => setEditingConfigItem({...editingConfigItem, label: e.target.value})}/></div>
                          <div><label className="block text-xs font-bold mb-1">排序</label><input type="number" className="w-full border rounded p-2" value={editingConfigItem.order} onChange={e => setEditingConfigItem({...editingConfigItem, order: Number(e.target.value)})}/></div>
                          <div className="flex gap-2 mt-2">{COLORS.map(c => <button key={c.value} onClick={() => setEditingConfigItem({...editingConfigItem, color: c.value})} className={`w-6 h-6 rounded-full border ${c.class.split(' ')[0]} ${editingConfigItem.color === c.value ? 'ring-2 ring-black' : ''}`} />)}</div>
                      </div>
                      <div className="p-4 border-t flex justify-end gap-2"><button onClick={() => setIsConfigModalOpen(false)} className="border px-4 py-2 rounded">取消</button><button onClick={handleConfigSave} className="bg-primary text-white px-4 py-2 rounded">儲存</button></div>
                  </div>
              </div>
          )}
      </div>
  );

  // --- CONTENT: C. Process Settings ---
  const renderProcessSettings = () => (
      <div className="flex h-full flex-col">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex gap-4">
              <button onClick={() => setActiveProcessTab('ROLES')} className={`py-2 border-b-2 font-bold ${activeProcessTab === 'ROLES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>角色權限管理</button>
              <button onClick={() => setActiveProcessTab('WORKFLOW')} className={`py-2 border-b-2 font-bold ${activeProcessTab === 'WORKFLOW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>簽核流程設定</button>
          </div>
          <div className="flex-1 overflow-hidden p-6">
              {activeProcessTab === 'ROLES' && <RoleManager />}
              
              {activeProcessTab === 'WORKFLOW' && (
                  <div className="max-w-4xl mx-auto space-y-8">
                      <div className="bg-blue-50 p-4 rounded border border-blue-200 text-blue-800 text-sm">
                          請定義「獎助學金兌換核銷」各階段的負責角色。系統將依此設定控制審核按鈕的權限。
                      </div>
                      <div className="relative">
                          {workflowSteps.map((step, idx) => (
                              <div key={step.id} className="flex items-center gap-4 mb-8 last:mb-0 relative z-10">
                                  {/* Step Circle */}
                                  <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-primary shadow-sm shrink-0">
                                      {idx + 1}
                                  </div>
                                  {/* Step Content */}
                                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                                      <div>
                                          <h4 className="font-bold text-gray-800">{step.stepName}</h4>
                                          <p className="text-xs text-gray-500 mt-1">關聯狀態: {step.relatedStatus}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-500">授權角色:</span>
                                          <div className="flex gap-1">
                                              {roles.map(r => (
                                                  <label key={r.id} className={`cursor-pointer px-2 py-1 rounded text-xs border ${step.authorizedRoleIds.includes(r.id) ? 'bg-primary-50 border-primary text-primary font-bold' : 'bg-white border-gray-200 text-gray-400'}`}>
                                                      <input 
                                                          type="checkbox" 
                                                          className="hidden" 
                                                          checked={step.authorizedRoleIds.includes(r.id)}
                                                          onChange={(e) => {
                                                              const newRoles = e.target.checked 
                                                                  ? [...step.authorizedRoleIds, r.id]
                                                                  : step.authorizedRoleIds.filter(id => id !== r.id);
                                                              setWorkflowSteps(prev => prev.map(s => s.id === step.id ? { ...s, authorizedRoleIds: newRoles } : s));
                                                          }}
                                                      />
                                                      {r.name}
                                                  </label>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {/* Connector Line */}
                          <div className="absolute top-5 bottom-5 left-5 w-0.5 bg-gray-200 -z-0"></div>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="flex h-full bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {renderSidebar()}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
          {activeCategory === 'BUSINESS' && renderBusinessLogic()}
          {activeCategory === 'INTERFACE' && renderInterfaceSettings()}
          {activeCategory === 'PROCESS' && renderProcessSettings()}
      </div>
    </div>
  );
};
