import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Typography, Button,
  message, Empty, Badge,
} from 'antd'
import {
  ReloadOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface AppointmentResponseDto {
  id: number
  customerId: number
  customerName: string
  preferredDate: string
  preferredTime: string
  status: string
  createdAt: string
}

const BASE_URL = 'http://localhost:5154/api'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('jwt')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) },
  })
  const text = await res.text()
  if (!text) return undefined as T
  const json = JSON.parse(text)
  if (!res.ok) throw new Error(json?.message || `Server error ${res.status}`)
  return json as T
}

export const Route = createFileRoute('/customer/service-history')({
  component: CustomerServiceHistoryPage,
})

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Pending:   { color: 'orange', icon: <ClockCircleOutlined /> },
    Confirmed: { color: 'blue',   icon: <CalendarOutlined /> },
    Completed: { color: 'green',  icon: <CheckCircleOutlined /> },
    Cancelled: { color: 'red',    icon: <ClockCircleOutlined /> },
  }
  const s = map[status] ?? { color: 'default', icon: null }
  return <Tag color={s.color} icon={s.icon}>{status}</Tag>
}

function CustomerServiceHistoryPage() {
  const customerId = 1 // TODO: replace with real JWT customer id
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([])
  const [loading, setLoading]           = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<AppointmentResponseDto[]>(
          `/History/appointments?customerId=${customerId}`
      )
      setAppointments(data ?? [])
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to load service history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const pending   = appointments.filter(a => a.status === 'Pending').length
  const confirmed = appointments.filter(a => a.status === 'Confirmed').length
  const completed = appointments.filter(a => a.status === 'Completed').length
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length

  const columns = [
    {
      title: 'Appointment Date',
      dataIndex: 'preferredDate',
      key: 'preferredDate',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Time',
      dataIndex: 'preferredTime',
      key: 'preferredTime',
      render: (t: string) => dayjs(`2000-01-01T${t}`).format('hh:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Pending',   value: 'Pending'   },
        { text: 'Confirmed', value: 'Confirmed' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value: unknown, record: AppointmentResponseDto) =>
          record.status === value,
      render: (s: string) => <StatusTag status={s} />,
    },
    {
      title: 'Booked On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
  ]

  return (
      <Card style={{ margin: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Service History</Title>
            <Text type="secondary">All your past and upcoming service appointments</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>
            Refresh
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f' }}>
            <Text type="secondary">Pending</Text>
            <div><Text strong style={{ fontSize: 28, color: '#d48806' }}>{pending}</Text></div>
            <Badge color="orange" text="Awaiting confirmation" />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#e6f4ff', border: '1px solid #91caff' }}>
            <Text type="secondary">Confirmed</Text>
            <div><Text strong style={{ fontSize: 28, color: '#1677ff' }}>{confirmed}</Text></div>
            <Badge color="blue" text="Scheduled" />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Text type="secondary">Completed</Text>
            <div><Text strong style={{ fontSize: 28, color: '#389e0d' }}>{completed}</Text></div>
            <Badge color="green" text="Done" />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff2f0', border: '1px solid #ffccc7' }}>
            <Text type="secondary">Cancelled</Text>
            <div><Text strong style={{ fontSize: 28, color: '#cf1322' }}>{cancelled}</Text></div>
            <Badge color="red" text="Cancelled" />
          </Card>
        </div>

        <Table
            columns={columns}
            dataSource={appointments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                  <Empty
                      description="No service history yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
              ),
            }}
        />
      </Card>
  )
}