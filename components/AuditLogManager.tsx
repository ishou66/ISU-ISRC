
import React, { useState } from 'react';
import { LogStatus } from '../types';
import { ICONS } from '../constants';
import { useSystem } from '../contexts/SystemContext';
import { ResizableHeader } from './ui/ResizableHeader';

export const AuditLogManager: React.FC = () => {
  const { systemLogs } = useSystem();
  const [filterActor, setFilterActor] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  
  const filteredLogs = systemLogs.filter(log => {
      const matchActor = log.actorName.toLowerCase().includes(filterActor.toLowerCase());
      const matchAction = filterAction === 'ALL' || log.actionType === filterAction;
      return matchActor && matchAction;
  });

  const getStatusColor = (status: LogStatus) => {
      switch(status) {
          case 'SUCCESS': return 'text-green-600 bg-green-50';
          case 'WARNING': return 'text-orange-600 bg-orange-50 font-bold';
          case 'FAILURE': return 'text-red-600 bg-red-50 font-bold';
          default: return 'text-gray-600';
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
         <div className="flex items-center gap-2"><ICONS.Audit className="text-isu-dark" size={20} /><h2 className="text-lg font-bold text-gray-800">資安稽核日誌</h2></div>
         <div className="flex gap-2">
            <div className="relative"><ICONS.Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="篩選操作者..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none" value={filterActor} onChange={e => setFilterActor(e.target.value)} /></div>
            <select className="text-sm border border-gray-300 rounded px-2 py-1.5 outline-none" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                <option value="ALL">所有動作</option><option value="VIEW_SENSITIVE">查看敏感資料</option><option value="UPDATE">更新資料</option><option value="CREATE">新增資料</option><option value="ACCESS_DENIED">權限不足 (警示)</option><option value="LOGIN">登入系統</option><option value="SYSTEM_RESET">系統重置</option>
            </select>
         </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 sticky top-0">
                <tr>
                    <ResizableHeader className="px-4 py-2 w-48">時間戳記</ResizableHeader>
                    <ResizableHeader className="px-4 py-2 w-32">IP</ResizableHeader>
                    <ResizableHeader className="px-4 py-2 w-40">操作者 (角色)</ResizableHeader>
                    <ResizableHeader className="px-4 py-2 w-32">動作類型</ResizableHeader>
                    <ResizableHeader className="px-4 py-2">目標物件 / 詳情</ResizableHeader>
                    <ResizableHeader className="px-4 py-2 w-24">狀態</ResizableHeader>
                </tr>
            </thead>
            <tbody className="font-mono text-xs">
                {filteredLogs.map(log => (
                    <tr key={log.id} className={`border-b hover:bg-gray-50 ${log.status !== 'SUCCESS' ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                        <td className="px-4 py-2 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-400">{log.ip}</td>
                        <td className="px-4 py-2 font-medium">{log.actorName} <span className="block text-[10px] text-gray-500">{log.roleName}</span></td>
                        <td className="px-4 py-2"><span className="px-1 py-0.5 rounded border border-gray-200 bg-white">{log.actionType}</span></td>
                        <td className="px-4 py-2"><div className="font-medium text-gray-800">{log.target}</div>{log.details && <div className="text-gray-500 mt-1">{log.details}</div>}</td>
                        <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded ${getStatusColor(log.status)}`}>{log.status}</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
        {filteredLogs.length === 0 && <div className="p-8 text-center text-gray-400">尚無符合條件的日誌紀錄</div>}
      </div>
    </div>
  );
};
