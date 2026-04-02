import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { useStore } from '#/data/store'
import type { Customer } from '#/types/index'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const store = useStore()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  const onFinish = (values: {
    fullName: string
    email: string
    phone: string
    address: string
    password: string
  }) => {
    const newCustomer: Customer = {
      id: 'c' + Date.now(),
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      password: values.password,
      vehicles: [],
      createdAt: new Date().toISOString(),
    }
    store.addCustomer(newCustomer)
    messageApi.success('Registration successful! Please log in.')
    setTimeout(() => navigate({ to: '/login' }), 1000)
  }

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
      {contextHolder}
      <Card style={{ width: 480 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Customer Registration
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Home Address"
            name="address"
            rules={[{ required: true, message: 'Please enter your address' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Typography.Text>Already have an account? </Typography.Text>
          <Link to="/login">Login</Link>
        </div>
      </Card>
    </div>
  )
}
