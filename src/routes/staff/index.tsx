import { createFileRoute } from '@tanstack/react-router'
import { Card, Typography } from 'antd'

export const Route = createFileRoute('/staff/')({
  component: StaffIndex,
})

function StaffIndex() {
  return (
    <Card>
      <Typography.Title level={3}>Staff Dashboard</Typography.Title>
      <Typography.Text type="secondary">Dashboard content coming soon.</Typography.Text>
    </Card>
  )
}
