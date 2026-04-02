import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from '@tanstack/react-router'
import type { MenuProps } from 'antd'

const menuItems: MenuProps['items'] = [
  { key: '/admin', label: 'Dashboard' },
  { key: '/admin/staff', label: 'Staff Management' },
  { key: '/admin/parts', label: 'Parts Management' },
  { key: '/admin/vendors', label: 'Vendors' },
  { key: '/admin/purchase-invoices', label: 'Purchase Invoices' },
  { key: '/admin/reports', label: 'Financial Reports' },
  { key: '/admin/part-requests', label: 'Part Requests' },
  { key: '/admin/notifications', label: 'Notifications' },
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const selectedKey =
    menuItems
      ?.map((item) => item?.key as string)
      .filter((key) => pathname === key || pathname.startsWith(key + '/'))
      .sort((a, b) => b.length - a.length)[0] ?? '/admin'

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
