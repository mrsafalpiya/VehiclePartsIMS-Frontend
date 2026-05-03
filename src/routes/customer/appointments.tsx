import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Modal, Form, DatePicker, TimePicker,
    Tag, Typography, Space, message, Empty, Badge,
} from 'antd'
import {
    PlusOutlined, ClockCircleOutlined, CheckCircleOutlined,
    ReloadOutlined, CalendarOutlined,
} from '@ant-design/icons'
import { useAuth } from '#/context/AuthContext'
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

export const Route = createFileRoute('/customer/appointments')({
    component: CustomerAppointmentsPage,
})

function StatusTag({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
        Pending:   { color: 'orange',  icon: <ClockCircleOutlined /> },
        Confirmed: { color: 'blue',    icon: <CalendarOutlined /> },
        Completed: { color: 'green',   icon: <CheckCircleOutlined /> },
        Cancelled: { color: 'red',     icon: <ClockCircleOutlined /> },
    }
    const s = map[status] ?? { color: 'default', icon: null }
    return <Tag color={s.color} icon={s.icon}>{status}</Tag>
}

function CustomerAppointmentsPage() {
   // const { currentUser } = useAuth()
   //  const customerId = Number((currentUser as any)?.id ?? 0)
    useAuth()
    const customerId = 1 // TODO: replace with real JWT customer id
    const [form] = Form.useForm()
    const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([])
    const [loading, setLoading]           = useState(false)
    const [modalOpen, setModalOpen]       = useState(false)
    const [submitting, setSubmitting]     = useState(false)

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const data = await apiFetch<AppointmentResponseDto[]>(
                `/Appointment/my?customerId=${customerId}`
            )
            setAppointments(data ?? [])
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to load appointments')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (customerId) fetchAppointments() }, [customerId])

    const handleSubmit = async () => {
        let values: { preferredDate: dayjs.Dayjs; preferredTime: dayjs.Dayjs }
        try { values = await form.validateFields() } catch { return }

        setSubmitting(true)
        try {
            await apiFetch('/Appointment?customerId=' + customerId, {
                method: 'POST',
                body: JSON.stringify({
                    preferredDate: values.preferredDate.format('YYYY-MM-DD'),
                    preferredTime: values.preferredTime.format('HH:mm'),
                }),
            })
            message.success('Appointment booked successfully!')
            form.resetFields()
            setModalOpen(false)
            fetchAppointments()
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to book appointment')
        } finally {
            setSubmitting(false)
        }
    }

    const pending   = appointments.filter(a => a.status === 'Pending').length
    const confirmed = appointments.filter(a => a.status === 'Confirmed').length
    const completed = appointments.filter(a => a.status === 'Completed').length

    const columns = [
        {
            title: 'Date',
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
        <>
            <Card style={{ margin: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>My Appointments</Title>
                        <Text type="secondary">Book and track your service appointments</Text>
                    </div>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchAppointments} loading={loading}>Refresh</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                            Book Appointment
                        </Button>
                    </Space>
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
                </div>

                <Table
                    columns={columns}
                    dataSource={appointments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                        emptyText: (
                            <Empty description="No appointments yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                                    Book Appointment
                                </Button>
                            </Empty>
                        ),
                    }}
                />
            </Card>

            <Modal
                title="Book a Service Appointment"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields() }}
                onOk={handleSubmit}
                okText="Book Appointment"
                confirmLoading={submitting}
                okButtonProps={{ icon: <CalendarOutlined /> }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Choose your preferred date and time for the service appointment.
                </Text>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="preferredDate"
                        label="Preferred Date"
                        rules={[{ required: true, message: 'Please select a date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            disabledDate={d => d.isBefore(dayjs(), 'day')}
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item
                        name="preferredTime"
                        label="Preferred Time"
                        rules={[{ required: true, message: 'Please select a time' }]}
                    >
                        <TimePicker
                            style={{ width: '100%' }}
                            format="hh:mm A"
                            minuteStep={30}
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}