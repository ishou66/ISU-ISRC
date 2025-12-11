
import React, { useState } from 'react';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Dropdown, Avatar, theme } from 'antd';
import { 
  LogoutOutlined, 
  SettingOutlined, 
  DashboardOutlined, 
  TeamOutlined, 
  BookOutlined, 
  ScheduleOutlined, 
  SafetyCertificateOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { User, RoleDefinition, ModuleId } from '../types';
import { usePermission } from '../hooks/usePermission';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  allUsers: User[];
  roles: RoleDefinition[];
  onResetSystem: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, currentView, onNavigate, currentUser, roles, onResetSystem 
}) => {
  const { can } = usePermission();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);

  // Map Views to Routes for ProLayout
  const route = {
    path: '/',
    routes: [
      {
        path: '/dashboard',
        name: '儀表板',
        icon: <DashboardOutlined />,
        view: 'DASHBOARD',
        access: 'DASHBOARD'
      },
      {
        path: '/students',
        name: '學生資料管理',
        icon: <TeamOutlined />,
        view: 'STUDENTS',
        access: 'STUDENTS'
      },
      {
        path: '/counseling',
        name: '輔導關懷紀錄',
        icon: <BookOutlined />,
        view: 'COUNSELING_MANAGER',
        access: 'COUNSELING_MANAGER'
      },
      {
        path: '/scholarship',
        name: '獎助學金管理',
        icon: <SafetyCertificateOutlined />,
        view: 'SCHOLARSHIP',
        access: 'SCHOLARSHIP'
      },
      {
        path: '/activity',
        name: '活動參與紀錄',
        icon: <ScheduleOutlined />,
        view: 'ACTIVITY',
        access: 'ACTIVITY'
      },
      {
        path: '/redemption',
        name: '兌換核銷中心',
        icon: <SafetyCertificateOutlined />,
        view: 'REDEMPTION_MANAGER',
        access: 'REDEMPTION'
      },
      {
        path: '/tickets',
        name: '客服中心',
        icon: <CustomerServiceOutlined />,
        view: 'TICKET_MANAGER',
        access: 'TICKETS'
      },
      {
        path: '/admin',
        name: '系統管理',
        icon: <ToolOutlined />,
        access: 'SYSTEM_SETTINGS',
        routes: [
            { path: '/settings', name: '參數設定', view: 'SETTINGS', access: 'SYSTEM_SETTINGS' },
            { path: '/users', name: '使用者與權限', view: 'USER_MANAGEMENT', access: 'USER_MANAGEMENT' },
            { path: '/audit', name: '資安日誌', view: 'AUDIT_LOGS', access: 'AUDIT_LOGS' },
        ]
      }
    ],
  };

  // Filter routes based on permissions
  const filterRoutes = (routes: any[]): any[] => {
      return routes.filter(r => {
          if (r.routes) {
              r.routes = filterRoutes(r.routes);
              return r.routes.length > 0;
          }
          return !r.access || can(r.access as ModuleId, 'view');
      });
  };

  const menuData = filterRoutes(route.routes);

  const getActivePath = () => {
      // Simple mapper to find current path from view ID
      const findPath = (items: any[]): string => {
          for (const item of items) {
              if (item.view === currentView) return item.path;
              if (item.routes) {
                  const sub = findPath(item.routes);
                  if (sub) return sub;
              }
          }
          return '/dashboard';
      };
      return findPath(menuData);
  };

  return (
    <div
      id="cloudschool-layout"
      style={{
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <ProLayout
        title="ISU 原資中心"
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" // React/Antd logo placeholder
        layout="mix"
        splitMenus={false}
        fixedHeader
        fixSiderbar
        contentWidth="Fluid"
        siderWidth={240}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedButtonRender={(collapsed) => (
            <div onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', fontSize: '16px' }}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
        )}
        token={{
            header: {
                colorBgHeader: '#ffffff',
                heightLayoutHeader: 56,
            },
            sider: {
                colorMenuBackground: '#001529', // Dark Blue Sidebar
                colorTextMenu: 'rgba(255,255,255,0.65)',
                colorTextMenuSelected: '#ffffff',
                colorBgMenuItemSelected: '#1890ff',
            }
        }}
        route={{ routes: menuData }}
        location={{ pathname: getActivePath() }}
        menuItemRender={(item, dom) => (
          <div onClick={() => { if(item.view) onNavigate(item.view); }}>
            {dom}
          </div>
        )}
        avatarProps={{
          src: currentUser.avatarUrl || 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          size: 'small',
          title: currentUser.name,
          render: (props, dom) => {
            return (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'settings',
                      icon: <SettingOutlined />,
                      label: '個人設定',
                    },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '登出系統',
                      onClick: () => window.location.reload()
                    },
                    {
                        type: 'divider'
                    },
                    {
                        key: 'reset',
                        label: '重置系統 (Debug)',
                        danger: true,
                        onClick: onResetSystem
                    }
                  ],
                }}
              >
                {dom}
              </Dropdown>
            );
          },
        }}
        footerRender={() => (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#888' }}>
                Copyright ©2024 義守大學原住民族學生資源中心 CloudSchool System
            </div>
        )}
      >
        <PageContainer
            header={{
                title: menuData.find(m => m.view === currentView)?.name || '系統頁面',
                breadcrumb: {
                    items: [
                        { title: '首頁' },
                        { title: menuData.find(m => m.view === currentView)?.name || currentView },
                    ],
                }
            }}
            style={{ minHeight: 'calc(100vh - 150px)' }}
        >
            {children}
        </PageContainer>
      </ProLayout>
    </div>
  );
};
    