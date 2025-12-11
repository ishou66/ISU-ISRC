
import React, { useState, useMemo } from 'react';
import { ConfigItem, ScholarshipConfig } from '../types';
import { ICONS } from '../constants';
import { useSystem, SystemSettingsData } from '../contexts/SystemContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useAuth } from '../contexts/AuthContext';
import { ResizableHeader } from './ui/ResizableHeader';
import { useToast } from '../contexts/ToastContext';

// --- Types ---
type NavGroup = 'PARAM_ACADEMIC' | 'PARAM_INDIGENOUS' | 'PARAM_COUNSELING' | 'PARAM_LIVING' | 'SYS_BASIC' | 'SYS_SCHOLARSHIP' | 'SYS_WORKFLOW' | 'SYS_MAINTENANCE';

interface SubCategoryDef {
    code: string;
    label: string;
    needsParent?: boolean;
    parentCategory?: string;
}

// --- Configuration Structure ---
const PARAM_GROUPS: Record<string, { label: string; icon: any; items: SubCategoryDef[] }> = {
    'PARAM_ACADEMIC': {
        label: '學籍參數設定',
        icon: ICONS.GraduationCap,
        items: [
            { code: 'DEPT', label: '系所單位 (Dept)' },
            { code: 'ADMISSION_CHANNEL', label: '入學管道' },
            { code: 'SUSPENSION_REASON', label: '休學原因' },
            { code: 'DROPOUT_REASON', label: '退學原因' }
        ]
    },
    'PARAM_INDIGENOUS': {
        label: '原民參數設定',
        icon: ICONS.MapPin,
        items: [
            { code: 'TRIBE', label: '族別代碼 (Tribe)' },
            { code: 'INDIGENOUS_CITY', label: '原鄉地區-縣市' },
            { code: 'INDIGENOUS_DISTRICT', label: '原鄉地區-鄉鎮', needsParent: true, parentCategory: 'INDIGENOUS_CITY' },
            { code: 'LANGUAGE_DIALECT', label: '族語方言', needsParent: true, parentCategory: 'TRIBE' }, // Assumes dialect links to Tribe or loose
            { code: 'LANGUAGE_LEVEL', label: '認證級別' }
        ]
    },
    'PARAM_COUNSELING': {
        label: '輔導參數設定',
        icon: ICONS.Heart,
        items: [
            { code: 'COUNSEL_METHOD', label: '進行方式' },
            { code: 'COUNSEL_CATEGORY', label: '輔導事項 (類別)' },
            { code: 'COUNSEL_RECOMMENDATION', label: '後續建議' }
        ]
    },
    'PARAM_LIVING': {
        label: '生活參數設定',
        icon: ICONS.Home,
        items: [
            { code: 'HOUSING_TYPE', label: '住宿類型' },
            { code: 'ECONOMIC_STATUS', label: '經濟等級' }
        ]
    }
};

const COLORS = [
    { value: 'blue', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', class: 'bg-green-100 text-green-800' },
    { value: 'red', class: 'bg-red-100 text-red-800' },
    { value: 'yellow', class: 'bg-yellow-100 text-yellow-800' },
    { value: 'gray', class: 'bg-gray-100 text-gray-800' },
    { value: 'purple', class: 'bg-purple-100 text-purple-800' },
];

export const SystemConfig: React.FC = () => {
  const { configs, setConfigs, workflowSteps, setWorkflowSteps, systemSettings, updateSystemSetting } = useSystem();
  const { scholarshipConfigs, setScholarshipConfigs } = useScholarships();
  const { roles } = useAuth();
  const { notify } = useToast();
  
  // Navigation
  const [activeGroup, setActiveGroup] = useState<NavGroup>('PARAM_ACADEMIC');
  const [activeSubCategoryIndex, setActiveSubCategoryIndex] = useState(0);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfigItem, setEditingConfigItem] = useState<Partial<ConfigItem> | null>(null);
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Partial<ScholarshipConfig>>({});

  // Helper: Get Current Param Definition
  const currentParamGroup = PARAM_GROUPS[activeGroup];
  const currentSubCategory = currentParamGroup?.items[activeSubCategoryIndex];

  const currentConfigs = useMemo(() => {
      if (!currentSubCategory) return [];
      return configs
        .filter(c => c.category === currentSubCategory.code)
        .sort((a,b) => a.order - b.order);
  }, [configs, currentSubCategory]);

  const parentOptions = useMemo(() => {
      if (currentSubCategory?.needsParent && currentSubCategory.parentCategory) {
          return configs
            .filter(c => c.category === currentSubCategory.parentCategory && c.isActive)
            .sort((a, b) => a.order - b.order);
      }
      return [];
  }, [configs, currentSubCategory]);

  // --- Handlers: Interface Settings ---
  const handleConfigSave = () => {
    if (!editingConfigItem?.code || !editingConfigItem?.label) { alert("請填寫代碼與名稱"); return; }
    if (currentSubCategory?.needsParent && !editingConfigItem.parentCode) { alert("此項目需選擇上層分類"); return; }

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
    notify('選項設定已儲存');
  };

  const handleDeleteConfig = (id: string) => {
      if(confirm('確定要刪除此選項嗎？')) {
          setConfigs(prev => prev.filter(c => c.id !== id));
          notify('選項已刪除');
      }
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
      notify('獎助學金規則已更新');
  };

  const handleSettingUpdate = (key: keyof SystemSettingsData, value: any) => {
      updateSystemSetting(key, value);
  };

  // --- RENDERERS ---

  // 1. Sidebar Navigation
  const renderSidebar = () => (
      <div className="w-64 bg-neutral-800 text-gray-300 flex flex-col shrink-0 h-full">
          <div className="p-5 border-b border-gray-700 bg-neutral-900">
              <h2 className="font-bold text-white flex items-center gap-2 text-lg"><ICONS.Settings size={20}/> 參數配置</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">參數管理</div>
              {Object.keys(PARAM_GROUPS).map((key) => {
                  const group = PARAM_GROUPS[key];
                  const isActive = activeGroup === key;
                  return (
                      <button 
                        key={key}
                        onClick={() => { setActiveGroup(key as NavGroup); setActiveSubCategoryIndex(0); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-neutral-700 hover:text-white'}`}
                      >
                          <group.icon size={18} />
                          <span className="font-medium">{group.label}</span>
                      </button>
                  );
              })}

              <div className="mt-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">系統管理</div>
              <button onClick={() => setActiveGroup('SYS_BASIC')} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeGroup === 'SYS_BASIC' ? 'bg-primary text-white' : 'hover:bg-neutral-700 hover:text-white'}`}>
                  <ICONS.Settings size={18} /> 系統設定
              </button>
              <button onClick={() => setActiveGroup('SYS_SCHOLARSHIP')} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeGroup === 'SYS_SCHOLARSHIP' ? 'bg-primary text-white' : 'hover:bg-neutral-700 hover:text-white'}`}>
                  <ICONS.Money size={18} /> 獎助規則
              </button>
              <button onClick={() => setActiveGroup('SYS_WORKFLOW')} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeGroup === 'SYS_WORKFLOW' ? 'bg-primary text-white' : 'hover:bg-neutral-700 hover:text-white'}`}>
                  <ICONS.Review size={18} /> 簽核流程
              </button>
              <button onClick={() => setActiveGroup('SYS_MAINTENANCE')} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeGroup === 'SYS_MAINTENANCE' ? 'bg-primary text-white' : 'hover:bg-neutral-700 hover:text-white'}`}>
                  <ICONS.Archive size={18} /> 資料維護
              </button>
          </div>
      </div>
  );

  // 2. Parameter Editor (Used for Academic, Indigenous, Counseling, Living)
  const renderParamEditor = () => (
      <div className="flex flex-col h-full bg-white">
          {/* Top Tabs for Sub-Categories */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 pt-4 flex gap-1 overflow-x-auto no-scrollbar">
              {currentParamGroup.items.map((item, idx) => (
                  <button
                    key={item.code}
                    onClick={() => setActiveSubCategoryIndex(idx)}
                    className={`px-4 py-3 text-sm font-bold border-t-2 rounded-t-lg transition-all whitespace-nowrap ${activeSubCategoryIndex === idx ? 'bg-white border-primary text-primary shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                  >
                      {item.label}
                  </button>
              ))}
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto p-6">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h3 className="text-xl font-bold text-gray-800">{currentSubCategory.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">代碼: <span className="font-mono">{currentSubCategory.code}</span></p>
                  </div>
                  <button 
                    onClick={() => { setEditingConfigItem({ category: currentSubCategory.code, isActive: true, order: currentConfigs.length + 1, color: 'gray' }); setIsConfigModalOpen(true); }} 
                    className="btn-primary px-3 py-2 rounded text-sm flex items-center gap-2 shadow-sm"
                  >
                      <ICONS.Plus size={16}/> 新增項目
                  </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                            <ResizableHeader className="p-3 w-16 text-center">排序</ResizableHeader>
                            {currentSubCategory.needsParent && <ResizableHeader className="p-3 w-40">上層分類</ResizableHeader>}
                            <ResizableHeader className="p-3 w-20 text-center">標籤色</ResizableHeader>
                            <ResizableHeader className="p-3 w-32">代碼</ResizableHeader>
                            <ResizableHeader className="p-3">顯示名稱</ResizableHeader>
                            <ResizableHeader className="p-3 w-24 text-center">狀態</ResizableHeader>
                            <ResizableHeader className="p-3 text-right w-24">操作</ResizableHeader>
                        </tr>
                      </thead>
                      <tbody>
                          {currentConfigs.length === 0 && (
                              <tr><td colSpan={7} className="p-8 text-center text-gray-400">尚無資料，請新增選項</td></tr>
                          )}
                          {currentConfigs.map(item => (
                              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 group">
                                  <td className="p-3 text-center text-gray-400">{item.order}</td>
                                  {currentSubCategory.needsParent && (
                                      <td className="p-3 text-gray-600">
                                          {configs.find(c => c.code === item.parentCode && c.category === currentSubCategory.parentCategory)?.label || <span className="text-red-300">-</span>}
                                      </td>
                                  )}
                                  <td className="p-3 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${COLORS.find(c=>c.value===item.color)?.class.split(' ')[0] || 'bg-gray-200'}`}></div></td>
                                  <td className="p-3 font-mono text-gray-600">{item.code}</td>
                                  <td className="p-3 font-bold text-gray-800">{item.label}</td>
                                  <td className="p-3 text-center">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{item.isActive ? '啟用' : '停用'}</span>
                                  </td>
                                  <td className="p-3 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setEditingConfigItem(item); setIsConfigModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><ICONS.Edit size={16}/></button>
                                          {!item.isSystemDefault && <button onClick={() => handleDeleteConfig(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><ICONS.Trash2 size={16}/></button>}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  // 3. System Components (Reused logic)
  const renderBasic = () => (
      <div className="p-8 space-y-8 max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">系統與通知設定</h2>
          <div className="card p-6 bg-white shadow-sm border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.Settings className="text-primary"/> 基礎資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-gray-600 mb-1">系統名稱</label><input className="w-full border rounded p-2" value={systemSettings.systemName} onChange={e => handleSettingUpdate('systemName', e.target.value)} /></div>
                  <div><label className="block text-sm font-bold text-gray-600 mb-1">學校名稱</label><input className="w-full border rounded p-2" value={systemSettings.schoolName} onChange={e => handleSettingUpdate('schoolName', e.target.value)} /></div>
                  <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">聯絡資訊 (Footer)</label><input className="w-full border rounded p-2" value={systemSettings.contactInfo} onChange={e => handleSettingUpdate('contactInfo', e.target.value)} /></div>
              </div>
          </div>
          <div className="card p-6 bg-white shadow-sm border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.Message className="text-primary"/> 通知服務 (SMTP/SMS)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-gray-600 mb-1">SMTP Host</label><input className="w-full border rounded p-2" value={systemSettings.smtpHost} onChange={e => handleSettingUpdate('smtpHost', e.target.value)} /></div>
                  <div><label className="block text-sm font-bold text-gray-600 mb-1">SMTP Port</label><input className="w-full border rounded p-2" value={systemSettings.smtpPort} onChange={e => handleSettingUpdate('smtpPort', e.target.value)} /></div>
                  <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">SMS API Key</label><input className="w-full border rounded p-2 font-mono" type="password" value={systemSettings.smsApiKey} onChange={e => handleSettingUpdate('smsApiKey', e.target.value)} /></div>
              </div>
          </div>
      </div>
  );

  const renderScholarshipRules = () => (
      <div className="p-8 h-full flex flex-col bg-gray-50">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">獎助學金規則</h2>
              <button onClick={() => { setEditingScholarship({ isActive: true, category: 'FINANCIAL_AID' }); setIsScholarshipModalOpen(true); }} className="btn-primary px-4 py-2 rounded text-sm flex items-center gap-2"><ICONS.Plus size={16}/> 新增項目</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                  <div><span className="text-gray-500 text-sm">當前學期</span><div className="text-2xl font-bold text-primary">{systemSettings.currentSemester}</div></div>
                  <input className="border rounded p-2 w-32 text-center" value={systemSettings.currentSemester} onChange={e => handleSettingUpdate('currentSemester', e.target.value)} placeholder="例: 112-1"/>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-sm mb-2">風險評估參數 (未關懷天數)</div>
                  <div className="flex gap-4">
                      <div className="flex-1"><label className="text-xs text-yellow-600 font-bold block">需關注 (Watch)</label><div className="flex items-center gap-2"><input type="number" className="border rounded p-1 w-full" value={systemSettings.riskThresholdWatch} onChange={e => handleSettingUpdate('riskThresholdWatch', Number(e.target.value))} /> <span className="text-xs">天</span></div></div>
                      <div className="flex-1"><label className="text-xs text-red-600 font-bold block">高風險 (Critical)</label><div className="flex items-center gap-2"><input type="number" className="border rounded p-1 w-full" value={systemSettings.riskThresholdCritical} onChange={e => handleSettingUpdate('riskThresholdCritical', Number(e.target.value))} /> <span className="text-xs">天</span></div></div>
                  </div>
              </div>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b">
                    <tr>
                        <th className="p-4">學期</th><th className="p-4">項目名稱</th><th className="p-4">類別</th><th className="p-4">金額</th><th className="p-4">時數要求</th><th className="p-4">狀態</th><th className="p-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                      {scholarshipConfigs.map(conf => (
                          <tr key={conf.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{conf.semester}</td>
                              <td className="p-4 font-bold text-gray-800">{conf.name}</td>
                              <td className="p-4"><span className={`px-2 py-1 rounded text-xs border ${conf.category === 'SCHOLARSHIP' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{conf.category === 'SCHOLARSHIP' ? '獎學金' : '助學金'}</span></td>
                              <td className="p-4 font-mono">${conf.amount.toLocaleString()}</td>
                              <td className="p-4">{conf.serviceHoursRequired} hr</td>
                              <td className="p-4"><span className={`w-2 h-2 rounded-full inline-block mr-2 ${conf.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>{conf.isActive ? '啟用' : '停用'}</td>
                              <td className="p-4 text-right"><button onClick={() => { setEditingScholarship(conf); setIsScholarshipModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><ICONS.Edit size={16}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderWorkflow = () => (
      <div className="p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">簽核流程設定</h2>
          <div className="space-y-6">
              {workflowSteps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm relative">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">{idx + 1}</div>
                      <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">{step.stepName}</h4>
                          <p className="text-xs text-gray-500 mb-3">System Status: {step.relatedStatus}</p>
                          <div className="flex flex-wrap gap-2">
                              {roles.map(r => (
                                  <label key={r.id} className={`cursor-pointer px-3 py-1.5 rounded text-xs border transition-colors ${step.authorizedRoleIds.includes(r.id) ? 'bg-primary-50 border-primary text-primary font-bold shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                      <input 
                                          type="checkbox" 
                                          className="hidden" 
                                          checked={step.authorizedRoleIds.includes(r.id)}
                                          onChange={(e) => {
                                              const newRoles = e.target.checked ? [...step.authorizedRoleIds, r.id] : step.authorizedRoleIds.filter(id => id !== r.id);
                                              setWorkflowSteps(prev => prev.map(s => s.id === step.id ? { ...s, authorizedRoleIds: newRoles } : s));
                                          }}
                                      />
                                      {r.name}
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderMaintenance = () => (
      <div className="p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">資料維護與政策</h2>
          <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2"><ICONS.Archive/> 資料保留政策</h3>
              <div className="flex items-center gap-4 mb-6">
                  <label className="font-bold text-sm text-gray-700">資安日誌保留天數</label>
                  <input className="border rounded p-2 w-32 text-center" type="number" value={systemSettings.logRetentionDays} onChange={e => handleSettingUpdate('logRetentionDays', Number(e.target.value))} />
                  <span className="text-xs text-gray-500">天 (超過將自動封存)</span>
              </div>
              <button onClick={() => notify('已執行舊資料清除作業')} className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded hover:bg-red-100 font-bold transition-colors">
                  立即執行過期日誌清理
              </button>
          </div>
      </div>
  );

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
        {renderSidebar()}
        <div className="flex-1 overflow-hidden relative">
            {activeGroup.startsWith('PARAM_') && renderParamEditor()}
            {activeGroup === 'SYS_BASIC' && renderBasic()}
            {activeGroup === 'SYS_SCHOLARSHIP' && renderScholarshipRules()}
            {activeGroup === 'SYS_WORKFLOW' && renderWorkflow()}
            {activeGroup === 'SYS_MAINTENANCE' && renderMaintenance()}
        </div>

        {/* Modal: Config Item */}
        {isConfigModalOpen && editingConfigItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-up">
                    <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold text-gray-800">選項設定</h3><button onClick={() => setIsConfigModalOpen(false)}><ICONS.Close/></button></div>
                    <div className="p-6 space-y-4">
                        {currentSubCategory?.needsParent && (
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">上層分類 ({currentSubCategory.parentCategory})</label><select className="w-full border rounded p-2.5 text-sm" value={editingConfigItem.parentCode || ''} onChange={e => setEditingConfigItem({...editingConfigItem, parentCode: e.target.value})}><option value="">請選擇...</option>{parentOptions.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}</select></div>
                        )}
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">代碼 (Code)</label><input className="w-full border rounded p-2.5 text-sm font-mono" value={editingConfigItem.code || ''} onChange={e => setEditingConfigItem({...editingConfigItem, code: e.target.value})} disabled={!!editingConfigItem.id && editingConfigItem.isSystemDefault}/></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">顯示名稱 (Label)</label><input className="w-full border rounded p-2.5 text-sm" value={editingConfigItem.label || ''} onChange={e => setEditingConfigItem({...editingConfigItem, label: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">排序</label><input type="number" className="w-full border rounded p-2.5 text-sm" value={editingConfigItem.order} onChange={e => setEditingConfigItem({...editingConfigItem, order: Number(e.target.value)})}/></div>
                        <div className="flex gap-2 pt-2">{COLORS.map(c => <button key={c.value} onClick={() => setEditingConfigItem({...editingConfigItem, color: c.value})} className={`w-6 h-6 rounded-full border ${c.class.split(' ')[0]} ${editingConfigItem.color === c.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} />)}</div>
                        <label className="flex items-center gap-2 pt-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={editingConfigItem.isActive} onChange={e => setEditingConfigItem({...editingConfigItem, isActive: e.target.checked})} className="w-4 h-4 text-primary focus:ring-primary rounded"/> 啟用此選項</label>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-xl"><button onClick={() => setIsConfigModalOpen(false)} className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-200">取消</button><button onClick={handleConfigSave} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-primary-hover">儲存</button></div>
                </div>
            </div>
        )}

        {/* Modal: Scholarship */}
        {isScholarshipModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                    <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold text-gray-800">編輯獎助項目</h3><button onClick={() => setIsScholarshipModalOpen(false)}><ICONS.Close/></button></div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">學期</label><input className="w-full border rounded p-2.5 text-sm" value={editingScholarship.semester || ''} onChange={e => setEditingScholarship({...editingScholarship, semester: e.target.value})} placeholder="112-1" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">類別</label><select className="w-full border rounded p-2.5 text-sm" value={editingScholarship.category} onChange={e => setEditingScholarship({...editingScholarship, category: e.target.value as any})}><option value="FINANCIAL_AID">助學金</option><option value="SCHOLARSHIP">獎學金</option></select></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">項目名稱</label><input className="w-full border rounded p-2.5 text-sm" value={editingScholarship.name || ''} onChange={e => setEditingScholarship({...editingScholarship, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">金額</label><input type="number" className="w-full border rounded p-2.5 text-sm" value={editingScholarship.amount} onChange={e => setEditingScholarship({...editingScholarship, amount: Number(e.target.value)})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">時數要求</label><input type="number" className="w-full border rounded p-2.5 text-sm" value={editingScholarship.serviceHoursRequired} onChange={e => setEditingScholarship({...editingScholarship, serviceHoursRequired: Number(e.target.value)})} /></div>
                        </div>
                        <label className="flex items-center gap-2 pt-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={editingScholarship.isActive} onChange={e => setEditingScholarship({...editingScholarship, isActive: e.target.checked})} className="w-4 h-4 text-primary focus:ring-primary rounded"/> 啟用此項目</label>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-xl"><button onClick={() => setIsScholarshipModalOpen(false)} className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-200">取消</button><button onClick={handleScholarshipSave} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-primary-hover">儲存</button></div>
                </div>
            </div>
        )}
    </div>
  );
};
