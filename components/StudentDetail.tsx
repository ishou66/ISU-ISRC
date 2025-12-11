
import React, { useState } from 'react';
import { ProDescriptions, DrawerForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Tabs } from 'antd';
import { Student } from '../types';
import { useStudents } from '../contexts/StudentContext';

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ student, onBack }) => {
  const { updateStudent } = useStudents();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleUpdate = async (values: any) => {
      await updateStudent({ ...student, ...values });
      message.success('更新成功');
      setDrawerVisible(false);
      return true;
  };

  const DetailView = () => (
      <ProDescriptions
        column={2}
        title="學生基本資料"
        tooltip="唯讀模式"
        dataSource={student}
        columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '學號', dataIndex: 'studentId' },
            { title: '系所', dataIndex: 'departmentCode' },
            { title: '年級', dataIndex: 'grade' },
            { title: '狀態', dataIndex: 'status', valueEnum: { '在學': { text: '在學', status: 'Success' } } },
            { title: '族別', dataIndex: 'tribeCode' },
            { title: '手機', dataIndex: 'phone' },
            { title: 'Email', dataIndex: 'emailPersonal' },
        ]}
      />
  );

  return (
    <div style={{ background: '#fff', padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
            <Button onClick={onBack} style={{ marginRight: 8 }}>返回列表</Button>
            <Button type="primary" onClick={() => setDrawerVisible(true)}>編輯資料</Button>
        </div>

        <Tabs
            items={[
                { label: '基本資料', key: 'info', children: <DetailView /> },
                { label: '輔導紀錄', key: 'logs', children: <div>輔導紀錄列表 (Use ProList here)</div> },
                { label: '獎助紀錄', key: 'scholarship', children: <div>獎助紀錄 (Use ProTable here)</div> },
            ]}
        />

        <DrawerForm<Student>
            title="編輯學生資料"
            open={drawerVisible}
            onOpenChange={setDrawerVisible}
            onFinish={handleUpdate}
            initialValues={student}
        >
            <ProFormText name="name" label="姓名" rules={[{ required: true }]} />
            <ProFormText name="studentId" label="學號" disabled />
            <ProFormSelect 
                name="departmentCode" 
                label="系所" 
                options={[
                    { label: '資工系', value: 'CS' },
                    { label: '企管系', value: 'BM' }
                ]}
            />
            <ProFormText name="phone" label="手機" />
            <ProFormText name="emailPersonal" label="Email" />
        </DrawerForm>
    </div>
  );
};
