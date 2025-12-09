import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../contexts/StudentContext'; 

export const Login: React.FC = () => {
  const { users, login, updatePassword } = useAuth();
  const { students } = useStudents();
  
  const [userType, setUserType] = useState<'STUDENT' | 'STAFF'>('STAFF');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userType === 'STUDENT') {
        const studentRegex = /^[A-Za-z0-9]+$/i;
        if (!studentRegex.test(account)) {
            setError('學號格式錯誤');
            return;
        }

        const student = students.find(s => s.studentId === account || s.username === account);
        
        if (!student) {
            setError('查無此學號');
            return;
        }

        if (student.isActive === false) {
            setError('此帳號已停用，請聯絡行政人員');
            return;
        }

        const mockHash = student.passwordHash || student.studentId; 
        if (password !== mockHash) {
            setError('密碼錯誤');
            return;
        }

        const sessionUser: any = {
            id: student.id,
            account: student.studentId,
            name: student.name,
            roleId: 'role_assistant',
            unit: student.departmentCode,
            email: student.emails?.school,
            isActive: true,
            avatarUrl: student.avatarUrl
        };
        
        login(sessionUser);
        return;
    }

    const user = users.find(u => u.account === account);

    if (!user) {
        setError('帳號不存在');
        return;
    }

    const validPass = user.password ? user.password === password : user.account === password;
    
    if (!validPass) {
        setError('密碼錯誤');
        return;
    }

    if (!user.isActive) {
        setError('此帳號已被停用，請聯繫管理員');
        return;
    }

    if (user.isFirstLogin) {
        setTempUserId(user.id);
        setIsChangingPassword(true);
        setError('');
        return;
    }

    login(user);
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (newPass.length < 6) { setError('新密碼長度需至少 6 碼'); return; }
      if (newPass !== confirmPass) { setError('兩次密碼輸入不一致'); return; }
      const tempUser = users.find(u => u.id === tempUserId);
      if (newPass === tempUser?.account) { setError('新密碼不可與帳號相同'); return; }

      if (tempUserId) {
          updatePassword(tempUserId, newPass);
          const updatedUser = users.find(u => u.id === tempUserId);
          if (updatedUser) login({ ...updatedUser, isFirstLogin: false, password: newPass });
      }
  };

  if (isChangingPassword) {
      return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><ICONS.Key size={32} /></div>
                    <h2 className="text-2xl font-bold text-gray-800">首次登入設定</h2><p className="text-gray-500 mt-2 text-sm">為了您的帳戶安全，請設定一組新密碼</p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label><input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="請輸入新密碼" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label><input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="再次輸入新密碼" /></div>
                    {error && <div className="bg-danger-50 text-danger p-3 rounded text-sm flex items-center gap-2"><ICONS.Alert size={16} /> {error}</div>}
                    <button type="submit" className="w-full bg-neutral-dark text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg mt-4">確認變更並登入</button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col mb-4">
        <div className="bg-neutral-bg p-6 text-center border-b border-neutral-border">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">I</div>
            <h1 className="text-xl font-bold text-neutral-text">義守大學原資中心</h1><p className="text-sm text-neutral-gray">學生輔導關懷系統</p>
        </div>
        <div className="flex border-b border-gray-200">
            <button className={`flex-1 py-4 text-sm font-medium transition-colors ${userType === 'STUDENT' ? 'border-b-2 border-primary text-primary bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => { setUserType('STUDENT'); setError(''); setAccount(''); setPassword(''); }}>學生登入</button>
            <button className={`flex-1 py-4 text-sm font-medium transition-colors ${userType === 'STAFF' ? 'border-b-2 border-primary text-primary bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => { setUserType('STAFF'); setError(''); setAccount(''); setPassword(''); }}>教職員登入</button>
        </div>
        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{userType === 'STUDENT' ? '學號' : '帳號 / Email'}</label>
                    <div className="relative"><ICONS.Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder={userType === 'STUDENT' ? '例如: 11200123A' : '請輸入帳號'} value={account} onChange={e => setAccount(e.target.value)} /></div>
                    {userType === 'STUDENT' && <p className="text-xs text-gray-400 mt-1 pl-1">預設密碼為學號</p>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">密碼</label>
                    <div className="relative"><ICONS.Security className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="password" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="請輸入密碼" value={password} onChange={e => setPassword(e.target.value)} /></div>
                    <div className="text-right mt-1"><a href="#" className="text-xs text-link hover:underline">忘記密碼?</a></div>
                </div>
                {error && <div className="bg-danger-50 text-danger p-3 rounded text-sm flex items-center gap-2 animate-pulse"><ICONS.Alert size={16} /> {error}</div>}
                <button type="submit" className="w-full btn-primary font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-2"><ICONS.Login size={20} /> 登入系統</button>
            </form>
        </div>
        <div className="bg-neutral-bg p-4 text-center text-xs text-neutral-gray border-t border-neutral-border">&copy; 2024 I-Shou University Indigenous Student Resource Center</div>
      </div>
      
      {/* Security Disclaimer */}
      <div className="max-w-md w-full bg-black/30 text-white text-xs p-3 rounded border border-white/10 text-center backdrop-blur-sm">
          <p className="font-bold mb-1 flex items-center justify-center gap-1"><ICONS.Alert size={12} /> 資安警示 / Security Notice</p>
          <p>本系統為展示版本 (Demo)，所有資料僅儲存於您的瀏覽器 (LocalStorage)。請勿輸入真實的個人敏感資料 (如真實身分證號、銀行帳號)。</p>
      </div>
    </div>
  );
};