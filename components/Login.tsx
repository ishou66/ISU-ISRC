
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../contexts/StudentContext'; 

export const Login: React.FC = () => {
  const { users, login, updatePassword } = useAuth();
  const { students, updateStudent } = useStudents();
  
  const [userType, setUserType] = useState<'STUDENT' | 'STAFF'>('STAFF');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // States for flows
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New State
  const [verificationId, setVerificationId] = useState('');
  
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [tempStudentId, setTempStudentId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Forgot Password State
  const [forgotInput, setForgotInput] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- STUDENT LOGIN FLOW ---
    if (userType === 'STUDENT') {
        // 1. Normalize Input: Trim whitespace and convert to lowercase
        const normalizedInput = account.trim().toLowerCase();

        // 2. Check Rule: Must start with 'isu'
        // Allow strict checking or flexible. Based on "Account Rule", we expect `isu` + numbers.
        // We will validate strictly but be helpful.
        if (!normalizedInput.startsWith('isu')) {
            setError('帳號格式錯誤：請使用「isu」+ 學號 (例如 isu11200123a)');
            return;
        }

        // 3. Find Student
        // We compare the normalized input against the student's username (which is also normalized to lowercase in StudentContext)
        // OR we strip 'isu' and check studentId for robustness.
        const student = students.find(s => 
            (s.username && s.username.toLowerCase() === normalizedInput) || 
            `isu${s.studentId.toLowerCase()}` === normalizedInput
        );
        
        if (!student) {
            setError('查無此帳號，請確認學號是否正確');
            return;
        }

        if (student.isActive === false) {
            setError('此帳號已停用，請聯絡行政人員');
            return;
        }

        // 4. Password Check
        // Default password is usually "isu" + studentId (lowercase)
        const mockHash = student.passwordHash || `isu${student.studentId.toLowerCase()}`;
        if (password !== mockHash) {
            setError('密碼錯誤');
            return;
        }

        // First Login Check
        if (student.isFirstLogin) {
            setTempStudentId(student.id);
            setIsVerifyingIdentity(true); // Go to National ID check
            setError('');
            return;
        }

        // Login Success
        doStudentLogin(student);
        return;
    }

    // --- STAFF LOGIN FLOW ---
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
        setIsChangingPassword(true); // Go to Password Change (Staff skip National ID check for now)
        setError('');
        return;
    }

    login(user);
  };

  const doStudentLogin = (student: any) => {
      // Create a Session User from Student Data
      const sessionUser: any = {
          id: student.id,
          account: student.studentId,
          name: student.name,
          roleId: 'role_assistant', // Map to student role
          unit: student.departmentCode,
          email: student.emails?.school,
          isActive: true,
          avatarUrl: student.avatarUrl
      };
      
      // Update last login
      updateStudent({ 
          ...student, 
          lastLogin: new Date().toISOString(),
          lastLoginIp: '127.0.0.1' // Mock IP
      });
      
      login(sessionUser);
  };

  const handleIdentityVerification = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      const student = students.find(s => s.id === tempStudentId);
      if (!student) return;

      // Verify National ID (Case Insensitive)
      if (verificationId.trim().toUpperCase() !== student.nationalId?.trim().toUpperCase()) {
          setError('身分證字號驗證失敗，請重新輸入');
          return;
      }

      // Verification Success -> Move to Change Password
      setIsVerifyingIdentity(false);
      setIsChangingPassword(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (newPass.length < 6) { setError('新密碼長度需至少 6 碼'); return; }
      if (newPass !== confirmPass) { setError('兩次密碼輸入不一致'); return; }
      
      // Logic for Staff
      if (tempUserId) {
          const tempUser = users.find(u => u.id === tempUserId);
          if (newPass === tempUser?.account) { setError('新密碼不可與帳號相同'); return; }
          
          updatePassword(tempUserId, newPass);
          const updatedUser = users.find(u => u.id === tempUserId);
          if (updatedUser) login({ ...updatedUser, isFirstLogin: false, password: newPass });
      } 
      // Logic for Student
      else if (tempStudentId) {
          const student = students.find(s => s.id === tempStudentId);
          if (!student) return;
          if (newPass === `isu${student.studentId.toLowerCase()}`) { setError('新密碼不可與預設密碼相同'); return; }

          updateStudent({
              ...student,
              passwordHash: newPass,
              isFirstLogin: false
          });
          
          // Auto login after change
          doStudentLogin({ ...student, passwordHash: newPass, isFirstLogin: false });
      }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!forgotInput || !forgotEmail) {
          setError('請填寫完整資訊');
          return;
      }
      
      // Simulation of backend check
      setTimeout(() => {
          alert(`密碼重置連結已發送至 ${forgotEmail}。\n請查收信件並依指示設定新密碼。`);
          setIsForgotPassword(false);
          setForgotInput('');
          setForgotEmail('');
          setError('');
      }, 1000);
  };

  // --- RENDER: FORGOT PASSWORD ---
  if (isForgotPassword) {
      return (
        <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-neutral-border animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600"><ICONS.Lock size={32} /></div>
                    <h2 className="text-2xl font-bold text-gray-800">忘記密碼</h2>
                    <p className="text-gray-500 mt-2 text-sm">輸入您的帳號與 Email 以重置密碼</p>
                </div>
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">帳號 / 學號 (Username)</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" 
                            value={forgotInput} 
                            onChange={e => setForgotInput(e.target.value)} 
                            placeholder="例如: isu11200123a" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">聯絡 Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" 
                            value={forgotEmail} 
                            onChange={e => setForgotEmail(e.target.value)} 
                            placeholder="請輸入註冊或學校信箱" 
                        />
                    </div>
                    {error && <div className="bg-danger-50 text-danger p-3 rounded text-sm flex items-center gap-2"><ICONS.Alert size={16} /> {error}</div>}
                    <button type="submit" className="w-full btn-primary text-white font-bold py-3 rounded-lg shadow-lg mt-4 flex items-center justify-center gap-2">
                        <ICONS.Send size={18}/> 發送重置連結
                    </button>
                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="w-full text-gray-500 py-2 text-sm hover:underline">取消返回登入</button>
                </form>
            </div>
        </div>
      );
  }

  // --- RENDER: IDENTITY VERIFICATION ---
  if (isVerifyingIdentity) {
      return (
        <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-neutral-border animate-fade-in">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><ICONS.UserCheck size={32} /></div>
                    <h2 className="text-2xl font-bold text-gray-800">首次登入身分驗證</h2>
                    <p className="text-gray-500 mt-2 text-sm">為了確保帳號安全，請驗證您的身分證字號</p>
                </div>
                <form onSubmit={handleIdentityVerification} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">身分證字號</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all uppercase placeholder:normal-case" 
                            value={verificationId} 
                            onChange={e => setVerificationId(e.target.value)} 
                            placeholder="首字大寫英文 + 9 碼數字" 
                        />
                    </div>
                    {error && <div className="bg-danger-50 text-danger p-3 rounded text-sm flex items-center gap-2"><ICONS.Alert size={16} /> {error}</div>}
                    <button type="submit" className="w-full btn-primary text-white font-bold py-3 rounded-lg shadow-lg mt-4">驗證身分</button>
                    <button type="button" onClick={() => { setIsVerifyingIdentity(false); setTempStudentId(null); }} className="w-full text-gray-500 py-2 text-sm hover:underline">取消返回</button>
                </form>
            </div>
        </div>
      );
  }

  // --- RENDER: CHANGE PASSWORD ---
  if (isChangingPassword) {
      return (
        <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-neutral-border animate-fade-in">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><ICONS.Key size={32} /></div>
                    <h2 className="text-2xl font-bold text-gray-800">設定新密碼</h2>
                    <p className="text-gray-500 mt-2 text-sm">首次登入強制修改密碼，請設定一組您容易記住的密碼</p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                        <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="請輸入新密碼" />
                        <p className="text-xs text-primary mt-1.5 flex items-start gap-1">
                            <ICONS.CheckCircle size={12} className="mt-0.5" />
                            建議和應用資訊系統 (AIS) 的密碼相同，以免忘記。
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
                        <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="再次輸入新密碼" />
                    </div>
                    {error && <div className="bg-danger-50 text-danger p-3 rounded text-sm flex items-center gap-2"><ICONS.Alert size={16} /> {error}</div>}
                    <button type="submit" className="w-full btn-primary text-white font-bold py-3 rounded-lg shadow-lg mt-4">確認變更並登入</button>
                </form>
            </div>
        </div>
      );
  }

  // --- RENDER: MAIN LOGIN ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center animate-fade-in-down">
          <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg transform rotate-3">I</div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">義守大學原資中心</h1>
          </div>
          <p className="text-gray-500 font-medium">學生輔導關懷暨資源管理系統</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col mb-6 border border-white/50 backdrop-blur-sm animate-fade-in-up">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100">
            <button 
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${userType === 'STUDENT' ? 'text-primary bg-primary-50/50' : 'text-gray-400 hover:bg-gray-50'}`} 
                onClick={() => { setUserType('STUDENT'); setError(''); setAccount(''); setPassword(''); }}
            >
                學生登入
                {userType === 'STUDENT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
            <button 
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${userType === 'STAFF' ? 'text-primary bg-primary-50/50' : 'text-gray-400 hover:bg-gray-50'}`} 
                onClick={() => { setUserType('STAFF'); setError(''); setAccount(''); setPassword(''); }}
            >
                管理人員登入
                {userType === 'STAFF' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
        </div>

        <div className="p-8 pt-6">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-gray-800">
                    {userType === 'STUDENT' ? '歡迎回來，同學！' : '管理後台登入'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    {userType === 'STUDENT' ? '預設密碼為 isu + 學號 (小寫)，首次登入須驗證身分' : '請輸入您的公務帳號與密碼'}
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">{userType === 'STUDENT' ? '學號帳號 (isu + Student ID)' : '帳號 / Email'}</label>
                    <div className="relative group">
                        <ICONS.Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" 
                            placeholder={userType === 'STUDENT' ? '例如: isu11200123a' : '請輸入帳號'} 
                            value={account} 
                            onChange={e => setAccount(e.target.value)} 
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">密碼 (Password)</label>
                    <div className="relative group">
                        <ICONS.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" 
                            placeholder="請輸入密碼" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            {showPassword ? <ICONS.EyeOff size={16} /> : <ICONS.Eye size={16} />}
                        </button>
                    </div>
                    <div className="text-right mt-2">
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-gray-400 hover:text-primary transition-colors font-medium">
                            忘記密碼?
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse border border-red-100">
                        <ICONS.Alert size={16} /> {error}
                    </div>
                )}

                <button type="submit" className="w-full btn-primary font-bold py-3.5 rounded-xl hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2 group">
                    <ICONS.Login size={20} className="group-hover:translate-x-1 transition-transform"/> 
                    {userType === 'STUDENT' ? '登入學生專區' : '登入管理系統'}
                </button>
            </form>

            {/* Test Helper */}
            {userType === 'STUDENT' && (
                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 mb-2">測試帳號提示 (首登驗證用)</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                        <button onClick={() => {setAccount('isu11200123a'); setPassword('isu11200123a');}} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 transition-colors">
                            王小明 (首登)
                        </button>
                        <button onClick={() => {setAccount('isu11200456b'); setPassword('isu11200456b');}} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 transition-colors">
                            李小花 (首登)
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="text-center text-[10px] text-gray-400">
          &copy; 2024 I-Shou University Indigenous Student Resource Center
      </div>
    </div>
  );
};
