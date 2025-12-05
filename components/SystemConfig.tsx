
import React, { useState } from 'react';
import { ConfigItem } from '../types';
import { ICONS } from '../constants';

interface SystemConfigProps {
  configs: ConfigItem[];
  setConfigs: React.Dispatch<React.SetStateAction<ConfigItem[]>>;
}

export const SystemConfig: React.FC<SystemConfigProps> = ({ configs, setConfigs }) => {
  const [activeTab, setActiveTab] = useState<'DEPT' | 'TRIBE' | 'SCHOLARSHIP' | 'COUNSEL_METHOD' | 'COUNSEL_CATEGORY' | 'COUNSEL_RECOMMENDATION'>('DEPT');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');

  const currentConfigs = configs.filter(c => c.category === activeTab).sort((a,b) => a.order - b.order);

  const handleAdd = () => {
    if (!newItemCode || !newItemLabel) return;
    const newItem: ConfigItem = {
      id: Math.random().toString(36).substr(2, 9),
      category: activeTab,
      code: newItemCode.toUpperCase(),
      label: newItemLabel,
      isActive: true,
      order: currentConfigs.length + 1
    };
    setConfigs([...configs, newItem]);
    setNewItemCode('');
    setNewItemLabel('');
  };

  const toggleStatus = (id: string) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const tabs = [
      { id: 'DEPT', label: '系所單位' },
      { id: 'TRIBE', label: '原住民族別' },
      { id: 'SCHOLARSHIP', label: '獎助學金' },
      { id: 'COUNSEL_METHOD', label: '輔導:進行方式' },
      { id: 'COUNSEL_CATEGORY', label: '輔導:諮詢類別' },
      { id: 'COUNSEL_RECOMMENDATION', label: '輔導:後續建議' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">系統參數配置</h2>
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id 
                        ? 'bg-isu-dark text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto">
                <label className="block text-xs font-bold text-gray-500 mb-1">代碼 (Code)</label>
                <input 
                    type="text" 
                    value={newItemCode}
                    onChange={e => setNewItemCode(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm w-full md:w-32" 
                    placeholder="例如: AI"
                />
            </div>
            <div className="flex-1 w-full md:w-auto">
                <label className="block text-xs font-bold text-gray-500 mb-1">名稱 (Label)</label>
                <input 
                    type="text" 
                    value={newItemLabel}
                    onChange={e => setNewItemLabel(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm w-full" 
                    placeholder="例如: 人工智慧學系"
                />
            </div>
            <button 
                onClick={handleAdd}
                className="bg-isu-red text-white px-4 py-2 rounded text-sm hover:bg-red-800 flex items-center gap-2 whitespace-nowrap"
            >
                <ICONS.Plus size={16} /> 新增
            </button>
        </div>

        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
                <tr>
                    <th className="px-4 py-2 rounded-tl-lg">排序</th>
                    <th className="px-4 py-2">代碼</th>
                    <th className="px-4 py-2">名稱</th>
                    <th className="px-4 py-2">狀態</th>
                    <th className="px-4 py-2 rounded-tr-lg text-right">操作</th>
                </tr>
            </thead>
            <tbody>
                {currentConfigs.map(item => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-500">{item.order}</td>
                        <td className="px-4 py-3 font-mono font-medium">{item.code}</td>
                        <td className="px-4 py-3">{item.label}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.isActive ? '啟用中' : '已停用'}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button 
                                onClick={() => toggleStatus(item.id)}
                                className="text-blue-600 hover:underline text-xs"
                            >
                                {item.isActive ? '停用' : '啟用'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
