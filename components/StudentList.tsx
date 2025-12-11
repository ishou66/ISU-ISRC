
import React, { useRef } from 'react';
import { ProTable, ActionType, ProColumns, TableDropdown } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Dropdown, Menu } from 'antd';
import { PlusOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { Student, StudentStatus, HighRiskStatus, ConfigItem } from '../types';
import { useStudents } from '../contexts/StudentContext';
import { usePermission } from '../hooks/usePermission';
import { ModuleId } from '../types';

interface StudentListProps {
  configs: ConfigItem[];
  onSelectStudent: (student: Student) => void;
  onRevealSensitiveData: (label: string) => void;
  initialParams?: any;
}

export const StudentList: React.FC<StudentListProps> = ({ configs, onSelectStudent }) => {
  const { students } = useStudents();
  const { can } = usePermission();
  const actionRef = useRef<ActionType>(null);

  const handlePrint = () => {
      window.print();
  };

  const handleExport = () => {
      message.success('正在匯出 Excel...');
      // Logic for XLSX export would go here
  };

  const columns: ProColumns<Student>[] = [
    {
      title: '學號',
      dataIndex: 'studentId',
      copyable: true,
      fixed: 'left',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
      render: (dom, entity) => (
        <a onClick={() => onSelectStudent(entity)}>{dom}</a>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        [StudentStatus.ACTIVE]: { text: '在學', status: 'Success' },
        [StudentStatus.SUSPENDED]: { text: '休學', status: 'Warning' },
        [StudentStatus.DROPPED]: { text: '退學', status: 'Error' },
        [StudentStatus.GRADUATED]: { text: '畢業', status: 'Default' },
      },
    },
    {
      title: '性別',
      dataIndex: 'gender',
      width: 60,
      search: false,
    },
    {
      title: '系所',
      dataIndex: 'departmentCode',
      valueType: 'select',
      valueEnum: configs.filter(c => c.category === 'DEPT').reduce((acc:any, c) => ({...acc, [c.code]: {text: c.label}}), {}),
    },
    {
      title: '年級',
      dataIndex: 'grade',
      valueType: 'select',
      valueEnum: { '1': '一年級', '2': '二年級', '3': '三年級', '4': '四年級' },
    },
    {
      title: '族別',
      dataIndex: 'tribeCode',
      valueType: 'select',
      valueEnum: configs.filter(c => c.category === 'TRIBE').reduce((acc:any, c) => ({...acc, [c.code]: {text: c.label}}), {}),
    },
    {
      title: '風險等級',
      dataIndex: 'highRisk',
      width: 100,
      valueType: 'select',
      valueEnum: {
          [HighRiskStatus.NONE]: { text: '一般', status: 'Default' },
          [HighRiskStatus.WATCH]: { text: '需關注', status: 'Warning' },
          [HighRiskStatus.CRITICAL]: { text: '高關懷', status: 'Error' },
      },
      render: (_, record) => (
          <Tag color={record.highRisk === HighRiskStatus.CRITICAL ? 'red' : record.highRisk === HighRiskStatus.WATCH ? 'orange' : 'green'}>
              {record.highRisk}
          </Tag>
      )
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 150,
      fixed: 'right',
      render: (text, record, _, action) => [
        <a key="edit" onClick={() => onSelectStudent(record)}>編輯</a>,
        <a key="view" onClick={() => onSelectStudent(record)}>查看</a>,
        <TableDropdown
          key="actionGroup"
          onSelect={() => action?.reload()}
          menus={[
            { key: 'copy', name: '複製' },
            { key: 'delete', name: '刪除' },
          ]}
        />,
      ],
    },
  ];

  return (
    <ProTable<Student>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      dataSource={students}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      options={{
        setting: {
          listsHeight: 400,
        },
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
      }}
      dateFormatter="string"
      headerTitle="學生資料列表"
      toolBarRender={() => [
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          列印
        </Button>,
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
          匯出 Excel
        </Button>,
        can(ModuleId.STUDENTS, 'add') && (
            <Button key="button" icon={<PlusOutlined />} type="primary">
            新增學生
            </Button>
        ),
      ]}
    />
  );
};
    