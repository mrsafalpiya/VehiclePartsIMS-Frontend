import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Form, Input, Button, Card, Select, message, Typography } from 'antd'
import { useEffect } from 'react'
import { useAuth } from '#/context/AuthContext'
import { useStore } from '#/data/store'
import type { UserRole } from '#/types/index'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { currentUser, role, login } = useAuth()
  const { customers } = useStore()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (currentUser) {
      if (role === 'admin') navigate({ to: '/admin' })
      else if (role === 'staff') navigate({ to: '/staff' })
      else navigate({ to: '/customer' })
    }
  }, [currentUser, role, navigate])

  const onFinish = (values: { email: string; password: string; role: UserRole }) => {
    const success = login(values.email, values.password, customers)
    if (success) {
      if (values.role === 'admin') navigate({ to: '/admin' })
      else if (values.role === 'staff') navigate({ to: '/staff' })
      else navigate({ to: '/customer' })
    } else {
      messageApi.error('Invalid email or password')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      {contextHolder}
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Garage Management System
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select your role' }]}
          >
            <Select placeholder="Select role">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="staff">Staff</Select.Option>
              <Select.Option value="customer">Customer</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Typography.Text>New customer? </Typography.Text>
          <Link to="/register">Register here</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/about">About Us</Link>
        </div>
      </Card>
    </div>
  )
}
