
import React from 'react';
import { LoginForm, ProFormText, ProFormCheckbox } from '@ant-design/pro-components';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { message, Tabs, Alert } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../contexts/StudentContext';

export const Login: React.FC = () => {
  const { users, login } = useAuth();
  const { students } = useStudents();
  const [loginType, setLoginType] = React.useState<string>('staff');
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const handleSubmit = async (values: any) => {
      setErrorMsg('');
      const { username, password } = values;

      if (loginType === 'staff') {
          const user = users.find(u => u.account === username);
          if (user && (user.password === password || user.account === password)) {
              if (!user.isActive) { setErrorMsg('帳號已停用'); return; }
              message.success('登入成功');
              login(user);
          } else {
              setErrorMsg('帳號或密碼錯誤');
          }
      } else {
          // Student Login
          const normalized = username.trim().toLowerCase();
          const student = students.find(s => 
            (s.username && s.username.toLowerCase() === normalized) || 
            `isu${s.studentId.toLowerCase()}` === normalized
          );
          
          const mockHash = student?.passwordHash || `isu${student?.studentId.toLowerCase()}`;

          if (student && password === mockHash) {
              if (student.isActive === false) { setErrorMsg('帳號已停用'); return; }
              message.success('學生登入成功');
              // Create Session
              login({
                  id: student.id,
                  account: student.studentId,
                  name: student.name,
                  roleId: 'role_student',
                  unit: student.departmentCode,
                  email: student.emailSchool || '',
                  isActive: true,
                  avatarUrl: student.avatarUrl
              });
          } else {
              setErrorMsg('學號或密碼錯誤');
          }
      }
  };

  return (
    <div style={{ 
        backgroundColor: '#f0f2f5', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        backgroundImage: "url('https://gw.alipayobjects.com/zos/rmsportal/FfdJeJRQWjEeGTpqgBKj.png')",
        backgroundSize: 'cover'
    }}>
      <LoginForm
        title="義守大學原資中心"
        subTitle="ISU Indigenous Student Resource Center System"
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        onFinish={handleSubmit}
        submitter={{
            searchConfig: { submitText: '登 入' },
            submitButtonProps: { size: 'large', style: { width: '100%' } }
        }}
      >
        <Tabs
          activeKey={loginType}
          onChange={setLoginType}
          centered
          items={[
            { key: 'staff', label: '教職員登入' },
            { key: 'student', label: '學生登入' },
          ]}
        />

        {errorMsg && (
            <Alert style={{ marginBottom: 24 }} message={errorMsg} type="error" showIcon />
        )}

        {loginType === 'staff' && (
          <>
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
              placeholder="請輸入帳號 (admin)"
              rules={[{ required: true, message: '請輸入帳號' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="請輸入密碼 (admin)"
              rules={[{ required: true, message: '請輸入密碼' }]}
            />
          </>
        )}

        {loginType === 'student' && (
          <>
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <SafetyCertificateOutlined /> }}
              placeholder="請輸入學號 (isu + 學號)"
              rules={[{ required: true, message: '請輸入學號' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="請輸入密碼 (預設同帳號)"
              rules={[{ required: true, message: '請輸入密碼' }]}
            />
          </>
        )}

        <div style={{ marginBottom: 24 }}>
          <ProFormCheckbox noStyle name="autoLogin">
            記住我
          </ProFormCheckbox>
          <a style={{ float: 'right' }}>忘記密碼</a>
        </div>
      </LoginForm>
    </div>
  );
};
    