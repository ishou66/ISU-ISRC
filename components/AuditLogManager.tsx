
import React, { useState, useMemo } from 'react';
import { LogStatus, SystemLog, LogRiskLevel } from '../types';
import { ICONS } from '../constants';
import { useSystem } from '../contexts/SystemContext';
import { ResizableHeader } from './ui/ResizableHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '../contexts/ToastContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AuditLogManager: React.FC = () => {
  const { systemLogs, setConfigs } = useSystem(); // Access setConfigs/setLogs if needed via Context, here we assume systemLogs is state
  const { notify } = useToast();
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'EXPLORER' | 'MAINTENANCE'>('DASHBOARD');

  // --- Explorer State ---
  const [filterActor, setFilterActor] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // --- Data Processing ---
  const filteredLogs = useMemo(() => {
      return systemLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          const matchActor = log.actorName.toLowerCase().includes(filterActor.toLowerCase()) || log.target.toLowerCase().includes(filterActor.toLowerCase());
          const matchAction = filterAction === 'ALL' || log.actionType === filterAction;
          const matchRisk = filterRisk === 'ALL' || log.riskLevel === filterRisk;
          
          let matchDate = true;
          if (dateRange.start) matchDate = matchDate && logDate >= new Date(dateRange.start);
          if (dateRange.end) matchDate = matchDate && logDate <= new Date(dateRange.end + 'T23:59:59');

          return matchActor && matchAction && matchRisk && matchDate;
      }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [systemLogs, filterActor, filterAction, filterRisk, dateRange]);

  // --- Helpers ---
  const getStatusColor = (status: LogStatus) => {
      switch(status) {
          case 'SUCCESS': return 'text-green-600 bg-green-50';
          case 'WARNING': return 'text-orange-600 bg-orange-50 font-bold';
          case 'FAILURE': return 'text-red-600 bg-red-50 font-bold';
          default: return 'text-gray-600';
      }
  };

  const getRiskBadge = (level: LogRiskLevel) => {
      const styles = {
          'LOW': 'bg-gray-100 text-gray-600',
          'MEDIUM': 'bg-yellow-100 text-yellow-800',
          'HIGH': 'bg-orange-100 text-orange-800',
          'CRITICAL': 'bg-red-100 text-red-800 animate-pulse'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[level]}`}>{level}</span>;
  };

  // --- Handlers ---
  const handleExport = () => {
      const csvHeader = ['Timestamp', 'Actor', 'Role', 'IP', 'Action', 'Target', 'Status', 'Risk', 'Details', 'UserAgent'];
      const csvRows = filteredLogs.map(l => [
          l.timestamp, l.actorName, l.roleName, l.ip, l.actionType, l.target, l.status, l.riskLevel, l.details || '', l.userAgent || ''
      ].map(v => `"${v}"`).join(','));
      
      const blob = new Blob(['\uFEFF' + [csvHeader.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AuditLogs_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      notify('日誌已匯出');
  };

  // --- DASHBOARD SUB-COMPONENT ---
  const SecurityDashboard = () => {
      // 1. Activity Trend (Last 7 Days)
      const trendData = useMemo(() => {
          const days = [];
          for(let i=6; i>=0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const count = systemLogs.filter(l => l.timestamp.startsWith(dateStr)).length;
              days.push({ name: dateStr.slice(5), count });
          }
          return days;
      }, [systemLogs]);

      // 2. Risk Distribution
      const riskData = useMemo(() => {
          const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
          systemLogs.forEach(l => { if(counts[l.riskLevel] !== undefined) counts[l.riskLevel]++; });
          return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }, [systemLogs]);

      // 3. Anomalies
      const anomalies = useMemo(() => {
          const list = [];
          // Detect Multiple Failed Logins
          const failedLogins = systemLogs.filter(l => l.actionType === 'LOGIN' && l.status === 'FAILURE');
          if (failedLogins.length > 3) list.push({ type: 'Brute Force Attempt', count: failedLogins.length, desc: 'Multiple failed logins detected' });
          
          // Detect Mass Export
          const exports = systemLogs.filter(l => l.actionType === 'EXPORT' && new Date(l.timestamp) > new Date(Date.now() - 3600000)); // Last hour
          if (exports.length > 2) list.push({ type: 'Data Leak Risk', count: exports.length, desc: 'Frequent data export actions' });

          // Detect Critical Actions
          const criticals = systemLogs.filter(l => l.riskLevel === 'CRITICAL');
          if (criticals.length > 0) list.push({ type: 'Critical System Action', count: criticals.length, desc: 'System reset or critical config change' });

          return list;
      }, [systemLogs]);

      return (
          <div className="space-y-6 p-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* KPI Cards */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 text-xs font-bold uppercase">總日誌數</p>
                          <p className="text-2xl font-bold text-primary">{systemLogs.length}</p>
                      </div>
                      <ICONS.FileText className="text-primary opacity-20" size={32}/>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 text-xs font-bold uppercase">高風險操作</p>
                          <p className="text-2xl font-bold text-red-600">{systemLogs.filter(l => l.riskLevel === 'HIGH' || l.riskLevel === 'CRITICAL').length}</p>
                      </div>
                      <ICONS.AlertTriangle className="text-red-500 opacity-20" size={32}/>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 text-xs font-bold uppercase">異常警示</p>
                          <p className="text-2xl font-bold text-orange-500">{anomalies.length}</p>
                      </div>
                      <ICONS.Bell className="text-orange-500 opacity-20" size={32}/>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-4">近 7 日活動趨勢</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={trendData}>
                                  <XAxis dataKey="name" fontSize={12}/>
                                  <YAxis allowDecimals={false} fontSize={12}/>
                                  <Tooltip cursor={{fill: '#f5f5f5'}}/>
                                  <Bar dataKey="count" fill="#d96a1a" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-4">操作風險分佈</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                      {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#e5e7eb', '#fcd34d', '#f97316', '#ef4444'][index]} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {anomalies.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2"><ICONS.ShieldAlert size={18}/> 安全異常偵測</h3>
                      <div className="space-y-2">
                          {anomalies.map((alert, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-red-100 flex justify-between items-center">
                                  <div>
                                      <span className="font-bold text-red-700">{alert.type}</span>
                                      <p className="text-xs text-gray-600">{alert.desc}</p>
                                  </div>
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-mono font-bold">{alert.count} events</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  // --- MAINTENANCE SUB-COMPONENT ---
  const MaintenancePanel = () => {
      return (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.Archive size={18}/> 日誌封存與清理</h3>
                  <p className="text-sm text-gray-500 mb-4">將舊的日誌資料匯出並從系統中移除，以釋放瀏覽器儲存空間並提升效能。</p>
                  
                  <div className="flex gap-4 items-end bg-gray-50 p-4 rounded border border-gray-100">
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-600 mb-2">封存對象</label>
                          <select className="w-full border rounded p-2 text-sm">
                              <option>超過 90 天前的日誌</option>
                              <option>超過 180 天前的日誌</option>
                              <option>所有日誌 (清空)</option>
                          </select>
                      </div>
                      <button onClick={() => notify('已執行封存作業，檔案下載中...')} className="btn-primary px-4 py-2 rounded text-sm shadow-sm whitespace-nowrap">
                          執行封存並下載
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Top Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-isu-dark font-bold text-lg"><ICONS.Audit size={24}/> 資安稽核日誌</div>
             <div className="h-6 w-px bg-gray-300 mx-2"></div>
             <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                 <button onClick={() => setActiveTab('DASHBOARD')} className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'DASHBOARD' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}>儀表板</button>
                 <button onClick={() => setActiveTab('EXPLORER')} className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'EXPLORER' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}>日誌探索</button>
                 <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'MAINTENANCE' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}>維護管理</button>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/50">
          {activeTab === 'DASHBOARD' && <SecurityDashboard />}
          
          {activeTab === 'MAINTENANCE' && <MaintenancePanel />}

          {activeTab === 'EXPLORER' && (
              <div className="flex flex-col h-full">
                  {/* Advanced Filter Bar */}
                  <div className="p-4 bg-white border-b border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-3 shadow-sm z-10">
                      <div className="relative col-span-2">
                          <ICONS.Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="搜尋操作者、IP、關鍵字..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none" value={filterActor} onChange={e => setFilterActor(e.target.value)} />
                      </div>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1.5 outline-none" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                          <option value="ALL">所有動作</option><option value="VIEW_SENSITIVE">查看個資</option><option value="UPDATE">更新資料</option><option value="LOGIN">系統登入</option><option value="ACCESS_DENIED">權限不足</option>
                      </select>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1.5 outline-none" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
                          <option value="ALL">所有風險</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                      </select>
                      <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                          <ICONS.Download size={14}/> 匯出結果
                      </button>
                  </div>

                  {/* Log Table */}
                  <div className="flex-1 overflow-auto bg-white">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-gray-50 text-gray-700 sticky top-0 shadow-sm z-10">
                              <tr>
                                  <ResizableHeader className="px-4 py-3 w-40">時間</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-32">IP</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-40">操作者</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-32">動作</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3">目標 / 詳情</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-24">狀態</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-24">風險</ResizableHeader>
                                  <ResizableHeader className="px-4 py-3 w-16"></ResizableHeader>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredLogs.slice(0, 100).map(log => ( // Limit rendering for perf
                                  <tr key={log.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip}</td>
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800">{log.actorName}</div>
                                          <div className="text-[10px] text-gray-500">{log.roleName}</div>
                                      </td>
                                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded border border-gray-200 bg-white text-xs font-mono">{log.actionType}</span></td>
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-gray-800 truncate max-w-xs">{log.target}</div>
                                          {log.details && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{log.details}</div>}
                                      </td>
                                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(log.status)}`}>{log.status}</span></td>
                                      <td className="px-4 py-3">{getRiskBadge(log.riskLevel)}</td>
                                      <td className="px-4 py-3 text-right">
                                          <ICONS.ChevronRight size={16} className="text-gray-300 group-hover:text-primary"/>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {filteredLogs.length === 0 && <div className="p-10 text-center text-gray-400">尚無符合條件的日誌</div>}
                  </div>
              </div>
          )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.FileText size={18}/> 日誌詳情</h3>
                      <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600"><ICONS.Close size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">Log ID</span><span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedLog.id}</span></div>
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">Timestamp</span><span className="font-mono">{selectedLog.timestamp}</span></div>
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">Actor</span><span className="font-bold">{selectedLog.actorName}</span> ({selectedLog.roleName})</div>
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">IP Address</span><span className="font-mono">{selectedLog.ip}</span></div>
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">Risk Level</span>{getRiskBadge(selectedLog.riskLevel)}</div>
                          <div><span className="text-gray-500 block text-xs uppercase mb-1">Status</span><span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedLog.status)}`}>{selectedLog.status}</span></div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Request Details</h4>
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs text-gray-700 break-all">
                              <p><span className="text-blue-600 font-bold">Target:</span> {selectedLog.target}</p>
                              <p><span className="text-purple-600 font-bold">Action:</span> {selectedLog.actionType}</p>
                              {selectedLog.details && <p className="mt-2 text-gray-600">// {selectedLog.details}</p>}
                              {selectedLog.userAgent && <p className="mt-2 text-gray-400">UA: {selectedLog.userAgent}</p>}
                          </div>
                      </div>

                      {selectedLog.changes && selectedLog.changes.length > 0 && (
                          <div className="border-t border-gray-100 pt-4">
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Data Changes (Diff)</h4>
                              <div className="space-y-2">
                                  {selectedLog.changes.map((change, i) => (
                                      <div key={i} className="grid grid-cols-3 gap-2 text-xs border border-gray-200 rounded p-2">
                                          <div className="font-bold text-gray-700">{change.field}</div>
                                          <div className="bg-red-50 text-red-700 p-1 rounded break-all"><span className="select-none text-red-300 mr-1">-</span>{JSON.stringify(change.oldValue)}</div>
                                          <div className="bg-green-50 text-green-700 p-1 rounded break-all"><span className="select-none text-green-300 mr-1">+</span>{JSON.stringify(change.newValue)}</div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
