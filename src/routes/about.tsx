import { createFileRoute, Link } from '@tanstack/react-router'
// @ts-ignore
import { Card, Descriptions, Typography } from 'antd'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})



function AboutPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '24px',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 600 }}>
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          Springfield Auto Garage
        </Typography.Title>
        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
          Your trusted vehicle service center since 2005. We provide expert repairs, maintenance,
          and genuine parts.
        </Typography.Paragraph>

        <Descriptions
          bordered
          column={1}
          items={[
            {
              key: 'address',
              label: 'Address',
              children: '42 Workshop Lane, Springfield, ST 12345',
            },
            {
              key: 'phone',
              label: 'Phone',
              children: '(555) 800-GARAGE',
            },
            {
              key: 'email',
              label: 'Email',
              children: 'info@springfieldgarage.com',
            },
            {
              key: 'hours',
              label: 'Working Hours',
              children:
                'Monday–Friday: 8:00 AM – 6:00 PM | Saturday: 9:00 AM – 4:00 PM | Sunday: Closed',
            },
          ]}
        />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </Card>
    </div>
  )
}
