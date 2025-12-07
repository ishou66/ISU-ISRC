
import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export const UserManager: React.FC = () => {
  const { users, roles, saveUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.account.includes(searchTerm) || u.unit.includes(searchTerm)
  );

  const handleCreate = () => {
    setEditingUser({ isActive: true, unit: '原資中心', roleId: roles[0]?.id });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser({...user});
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingUser.account || !editingUser.name || !editingUser.roleId) {
        alert("請填寫必填欄位");
        return;
    }
    const userToSave: User = {
        id: editingUser.id || `user_${Math.random().toString(36).substr(2, 9)}`,
        account: editingUser.account!,
        name: editingUser.name!,
        unit: editingUser.unit || '',
        roleId: editingUser.roleId!,
        email: editingUser.email || '',
        isActive: editingUser.isActive ?? true,
        lastLogin: editingUser.lastLogin,
        avatarUrl: editingUser.avatarUrl || `https://ui-avatars.com/api/?name=${editingUser.name}&background=random`
    };
    saveUser(userToSave);
    setIsModalOpen(false);
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || '未知角色';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ICONS.Users className="text-isu-dark" /> 使用者管理</h2>
        <div className="flex gap-2">
            <div className="relative"><ICONS.Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="搜尋帳號、姓名..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
            <button onClick={handleCreate} className="bg-isu-red text-white px-3 py-1.5 rounded text-sm hover:bg-red-800 flex items-center gap-2"><ICONS.Plus size={16} /> 新增使用者</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 sticky top-0"><tr><th className="px-4 py-3">狀態</th><th className="px-4 py-3">帳號</th><th className="px-4 py-3">姓名</th><th className="px-4 py-3">單位</th><th className="px-4 py-3">角色權限</th><th className="px-4 py-3">Email</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody>
                {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{user.isActive ? '啟用' : '停用'}</span></td>
                        <td className="px-4 py-3 font-mono font-medium">{user.account}</td>
                        <td className="px-4 py-3 font-medium flex items-center gap-2"><img src={user.avatarUrl} className="w-6 h-6 rounded-full" alt="avatar" />{user.name}</td>
                        <td className="px-4 py-3">{user.unit}</td>
                        <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">{getRoleName(user.roleId)}</span></td>
                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2"><button onClick={() => handleEdit(user)} className="text-gray-500 hover:text-isu-dark p-1"><ICONS.Edit size={16} /></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800">{editingUser.id ? '編輯使用者' : '新增使用者'}</h3><button onClick={() => setIsModalOpen(false)}><ICONS.Close size={20} /></button></div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">帳號</label><input className="w-full border rounded px-3 py-2" value={editingUser.account || ''} onChange={e => setEditingUser({...editingUser, account: e.target.value})} disabled={!!editingUser.id}/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">姓名</label><input className="w-full border rounded px-3 py-2" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})}/></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">單位</label><input className="w-full border rounded px-3 py-2" value={editingUser.unit || ''} onChange={e => setEditingUser({...editingUser, unit: e.target.value})}/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">角色</label><select className="w-full border rounded px-3 py-2" value={editingUser.roleId || ''} onChange={e => setEditingUser({...editingUser, roleId: e.target.value})}>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input className="w-full border rounded px-3 py-2" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})}/></div>
                    <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="isActive" checked={editingUser.isActive} onChange={e => setEditingUser({...editingUser, isActive: e.target.checked})} className="w-4 h-4 text-isu-red focus:ring-isu-red"/><label htmlFor="isActive" className="text-sm text-gray-700">啟用此帳號</label></div>
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">取消</button><button onClick={handleSave} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm">儲存</button></div>
            </div>
        </div>
      )}
    </div>
  );
};
