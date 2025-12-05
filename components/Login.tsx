
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onUpdatePassword: (userId: string, newPass: string) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLoginSuccess, onUpdatePassword }) => {
  const [userType, setUserType] = useState<'STUDENT' | 'STAFF'>('STAFF');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Regex check for Student
    if (userType === 'STUDENT') {
        const studentRegex = /^isu\d{3}\d{2}\d{3}[a-zA-Z]$/i;
        if (!studentRegex.test(account)) {
            setError('學號格式錯誤 (範例: isu11481015a)');
            return;
        }
    }

    const user = users.find(u => u.account === account);

    if (!user) {
        setError('帳號不存在');
        return;
    }

    // Role check
    const isAssistant = user.roleId === 'role_assistant';
    if (userType === 'STUDENT' && !isAssistant) {
        setError('此帳號非學生帳號，請切換至教職員登入');
        return;
    }
    if (userType === 'STAFF' && isAssistant) {
         setError('此帳號為學生工讀生，請切換至學生登入');
         return;
    }

    // Password Check (Mock logic: if user has password field, check it, else check account)
    const validPass = user.password ? user.password === password : user.account === password;
    
    if (!validPass) {
        setError('密碼錯誤');
        return;
    }

    if (!user.isActive) {
        setError('此帳號已被停用，請聯繫管理員');
        return;
    }

    // Check First Login
    if (user.isFirstLogin) {
        setTempUser(user);
        setIsChangingPassword(true);
        setError('');
        return;
    }

    onLoginSuccess(user);
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (newPass.length < 6) {
          setError('新密碼長度需至少 6 碼');
          return;
      }

      if (newPass !== confirmPass) {
          setError('兩次密碼輸入不一致');
          return;
      }

      if (newPass === tempUser?.account) {
          setError('新密碼不可與帳號相同');
          return;
      }

      if (tempUser) {
          onUpdatePassword(tempUser.id, newPass);
          // Auto login after update
          onLoginSuccess({ ...tempUser, isFirstLogin: false }); 
      }
  };

  if (isChangingPassword) {
      return (
        <div className="min-h-screen bg-isu-red flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                        <ICONS.Key size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">首次登入設定</h2>
                    <p className="text-gray-500 mt-2 text-sm">為了您的帳戶安全，請設定一組新密碼</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-isu-red outline-none transition-all"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="請輸入新密碼"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-isu-red outline-none transition-all"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            placeholder="再次輸入新密碼"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2">
                            <ICONS.Alert size={16} /> {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-isu-dark text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg mt-4"
                    >
                        確認變更並登入
                    </button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-isu-red to-red-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 p-6 text-center border-b border-gray-100">
            <div className="w-12 h-12 bg-isu-dark rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">I</div>
            <h1 className="text-xl font-bold text-gray-800">義守大學原資中心</h1>
            <p className="text-sm text-gray-500">學生輔導關懷系統</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${userType === 'STUDENT' ? 'border-b-2 border-isu-red text-isu-red bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => { setUserType('STUDENT'); setError(''); setAccount(''); setPassword(''); }}
            >
                學生登入
            </button>
            <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${userType === 'STAFF' ? 'border-b-2 border-isu-red text-isu-red bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => { setUserType('STAFF'); setError(''); setAccount(''); setPassword(''); }}
            >
                教職員登入
            </button>
        </div>

        {/* Form */}
        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        {userType === 'STUDENT' ? '學號' : '帳號 / Email'}
                    </label>
                    <div className="relative">
                        <ICONS.Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isu-red focus:border-transparent outline-none transition-all"
                            placeholder={userType === 'STUDENT' ? '例如: isu11481015a' : '請輸入帳號'}
                            value={account}
                            onChange={e => setAccount(e.target.value)}
                        />
                    </div>
                    {userType === 'STUDENT' && <p className="text-xs text-gray-400 mt-1 pl-1">格式：isu + 3碼 + 2碼 + 3碼 + 1英文字</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">密碼</label>
                    <div className="relative">
                        <ICONS.Security className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isu-red focus:border-transparent outline-none transition-all"
                            placeholder="請輸入密碼"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="text-right mt-1">
                        <a href="#" className="text-xs text-blue-600 hover:underline">忘記密碼?</a>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2 animate-pulse">
                        <ICONS.Alert size={16} /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-isu-red text-white font-bold py-3 rounded-lg hover:bg-red-800 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                    <ICONS.Login size={20} />
                    登入系統
                </button>
            </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
            &copy; 2024 I-Shou University Indigenous Student Resource Center
        </div>
      </div>
    </div>
  );
};
