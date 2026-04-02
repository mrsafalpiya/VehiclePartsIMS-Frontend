import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from '@tanstack/react-router'
import type { MenuProps } from 'antd'

const menuItems: MenuProps['items'] = [
  { key: '/customer', label: 'Dashboard' },
  { key: '/customer/profile', label: 'My Profile' },
  { key: '/customer/vehicles', label: 'My Vehicles' },
  { key: '/customer/appointments', label: 'Book Appointment' },
  { key: '/customer/part-requests', label: 'Request Part' },
  { key: '/customer/purchase-history', label: 'Purchase History' },
  { key: '/customer/service-history', label: 'Service History' },
  { key: '/customer/reviews', label: 'Write Review' },
]

export default function CustomerSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const selectedKey =
    menuItems
      ?.map((item) => item?.key as string)
      .filter((key) => pathname === key || pathname.startsWith(key + '/'))
      .sort((a, b) => b.length - a.length)[0] ?? '/customer'

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
