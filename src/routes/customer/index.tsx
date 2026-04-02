import { createFileRoute } from '@tanstack/react-router'
import { Card, Typography } from 'antd'

export const Route = createFileRoute('/customer/')({
  component: CustomerIndex,
})

function CustomerIndex() {
  return (
    <Card>
      <Typography.Title level={3}>Customer Dashboard</Typography.Title>
      <Typography.Text type="secondary">Dashboard content coming soon.</Typography.Text>
    </Card>
  )
}
