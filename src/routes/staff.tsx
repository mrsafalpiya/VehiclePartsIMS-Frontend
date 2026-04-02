import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Layout, Button, Typography, Space } from 'antd'
import { useAuth } from '#/context/AuthContext'
import StaffSidebar from '#/components/StaffSidebar'

export const Route = createFileRoute('/staff')({
  component: StaffLayout,
})

function StaffLayout() {
  const { currentUser, role, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser || role !== 'staff') {
      navigate({ to: '/login' })
    }
  }, [currentUser, role, navigate])

  if (!currentUser || role !== 'staff') return null

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <StaffSidebar />
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
          <Typography.Text strong>Staff Panel</Typography.Text>
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
