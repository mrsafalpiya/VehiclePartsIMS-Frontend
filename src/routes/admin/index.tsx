import { createFileRoute } from '@tanstack/react-router'
import { Card, Typography } from 'antd'

export const Route = createFileRoute('/admin/')({
  component: AdminIndex,
})

function AdminIndex() {
  return (
    <Card>
      <Typography.Title level={3}>Admin Dashboard</Typography.Title>
      <Typography.Text type="secondary">Dashboard content coming soon.</Typography.Text>
    </Card>
  )
}
