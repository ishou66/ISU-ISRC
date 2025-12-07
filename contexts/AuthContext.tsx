
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, RoleDefinition } from '../types';
import { StorageService } from '../services/StorageService';
import { DEFAULT_USERS, DEFAULT_ROLES } from '../constants';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  roles: RoleDefinition[];
  login: (user: User) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  updatePassword: (userId: string, newPass: string) => void;
  saveUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  saveRole: (role: RoleDefinition) => void;
  deleteRole: (roleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEYS = StorageService.getKeys();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => StorageService.load(KEYS.USERS, DEFAULT_USERS));
  const [roles, setRoles] = useState<RoleDefinition[]>(() => StorageService.load(KEYS.ROLES, DEFAULT_ROLES));
  const { notify } = useToast();

  useEffect(() => {
    StorageService.save(KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    StorageService.save(KEYS.ROLES, roles);
  }, [roles]);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      notify(`已切換為：${user.name}`);
    }
  };

  const updatePassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => {
        if (u.id === userId) {
            return { ...u, password: newPass, isFirstLogin: false };
        }
        return u;
    }));
    notify('密碼已更新，請重新登入');
  };

  const saveUser = (user: User) => {
    setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev.map(u => u.id === user.id ? user : u);
        return [...prev, user];
    });
    notify('使用者資料已儲存');
  };

  const deleteUser = (userId: string) => {
      // Logic delete usually, currently strictly removing
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
      notify('使用者已停用');
  };

  const saveRole = (role: RoleDefinition) => {
    setRoles(prev => {
        const exists = prev.find(r => r.id === role.id);
        if (exists) return prev.map(r => r.id === role.id ? role : r);
        return [...prev, role];
    });
    notify('角色權限已更新');
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
    notify('角色已刪除');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      roles,
      login,
      logout,
      switchUser,
      updatePassword,
      saveUser,
      deleteUser,
      saveRole,
      deleteRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
