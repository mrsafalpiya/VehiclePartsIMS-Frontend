import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from '@tanstack/react-router'
import type { MenuProps } from 'antd'

const menuItems: MenuProps['items'] = [
  { key: '/staff', label: 'Dashboard' },
  { key: '/staff/customers', label: 'Customers' },
  { key: '/staff/sales/new', label: 'New Sale' },
  { key: '/staff/customer-reports', label: 'Customer Reports' },
  { key: '/staff/customer-search', label: 'Customer Search' },
]

export default function StaffSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const selectedKey =
    menuItems
      ?.map((item) => item?.key as string)
      .filter((key) => pathname === key || pathname.startsWith(key + '/'))
      .sort((a, b) => b.length - a.length)[0] ?? '/staff'

  return (
    <Layout.Sider
      style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      width={220}
    >
      <div
        style={{
          padding: '16px',
          fontWeight: 'bold',
          fontSize: '16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        Garage System
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ borderRight: 'none' }}
        onClick={({ key }) => navigate({ to: key as any })}
      />
    </Layout.Sider>
  )
}
