import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Layout, Button, Typography, Space } from 'antd'
import { useAuth } from '#/context/AuthContext'
import CustomerSidebar from '#/components/CustomerSidebar'

export const Route = createFileRoute('/customer')({
  component: CustomerLayout,
})

function CustomerLayout() {
  const { currentUser, role, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser || role !== 'customer') {
      navigate({ to: '/login' })
    }
  }, [currentUser, role, navigate])

  if (!currentUser || role !== 'customer') return null

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CustomerSidebar />
      <Layout>
        <Layout.Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Typography.Text strong>Customer Portal</Typography.Text>
          <Space>
            <Typography.Text>{currentUser.fullName}</Typography.Text>
            <Button size="small" onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
