import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
    Card, Table, Tag, Typography, Button,
    message, Empty, Modal, Descriptions,
} from 'antd'
import {
    ReloadOutlined, MailOutlined, EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface SalesInvoiceItemDto {
    partName: string
    partNumber: string
    quantity: number
    unitSellingPrice: number
    totalPrice: number
}

interface SalesInvoiceResponseDto {
    id: number
    invoiceNumber: string
    invoiceDate: string
    customerName: string
    customerEmail: string
    staffName: string
    subtotal: number
    loyaltyDiscount?: number
    finalTotal: number
    paymentStatus: string
    items: SalesInvoiceItemDto[]
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
    let res: Response
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) },
        })
    } catch (networkErr) {
        throw new Error(`Network error — is the backend running? (${String(networkErr)})`)
    }
    const text = await res.text()
    if (!text) return undefined as T
    const json = JSON.parse(text)
    if (!res.ok) throw new Error(json?.message || `Server error ${res.status}`)
    return json as T
}

export const Route = createFileRoute('/staff/sales-invoices')({
    component: StaffSalesInvoicesPage,
})

function StaffSalesInvoicesPage() {
    const [invoices, setInvoices]           = useState<SalesInvoiceResponseDto[]>([])
    const [loading, setLoading]             = useState(false)
    const [selectedInvoice, setSelected]    = useState<SalesInvoiceResponseDto | null>(null)
    const [detailOpen, setDetailOpen]       = useState(false)
    const [sendingEmail, setSendingEmail]   = useState<number | null>(null)

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            const data = await apiFetch<SalesInvoiceResponseDto[]>('/Invoice/sales')
            setInvoices(data ?? [])
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchInvoices() }, [])

    const handleSendEmail = async (invoiceId: number, invoiceNumber: string) => {
        setSendingEmail(invoiceId)
        try {
            await apiFetch(`/Email/invoice/${invoiceId}`, { method: 'POST' })
            message.success(`Invoice ${invoiceNumber} sent to customer email!`)
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to send email')
        } finally {
            setSendingEmail(null)
        }
    }

    const columns = [
        {
            title: 'Invoice #',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (n: string) => <Text strong style={{ color: '#1677ff' }}>{n}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'invoiceDate',
            key: 'invoiceDate',
            render: (d: string) => dayjs(d).format('DD MMM YYYY'),
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (n: string) => <Text strong>{n}</Text>,
        },
        {
            title: 'Total',
            dataIndex: 'finalTotal',
            key: 'finalTotal',
            render: (t: number) => <Text strong>£{t.toLocaleString()}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (s: string) => (
                <Tag color={s === 'Paid' ? 'green' : 'red'}>{s}</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: SalesInvoiceResponseDto) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => { setSelected(record); setDetailOpen(true) }}
                    >
                        View
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        icon={<MailOutlined />}
                        loading={sendingEmail === record.id}
                        onClick={() => handleSendEmail(record.id, record.invoiceNumber)}
                    >
                        Send Email
                    </Button>
                </div>
            ),
        },
    ]

    const lineItemColumns = [
        {
            title: 'Part',
            dataIndex: 'partName',
            key: 'partName',
            render: (n: string) => <Text strong>{n}</Text>,
        },
        {
            title: 'Part Code',
            dataIndex: 'partNumber',
            key: 'partNumber',
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 60,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitSellingPrice',
            key: 'unitSellingPrice',
            render: (p: number) => `£${p.toLocaleString()}`,
        },
        {
            title: 'Total',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (t: number) => <Text strong>£{t.toLocaleString()}</Text>,
        },
    ]

    return (
        <>
            <Card style={{ margin: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Sales Invoices</Title>
                        <Text type="secondary">View and email invoices to customers</Text>
                    </div>
                    <Button icon={<ReloadOutlined />} onClick={fetchInvoices} loading={loading}>
                        Refresh
                    </Button>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Text type="secondary">Total Invoices</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#1677ff' }}>{invoices.length}</Text></div>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text type="secondary">Paid</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#389e0d' }}>
                            {invoices.filter(i => i.paymentStatus === 'Paid').length}
                        </Text></div>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff2f0', border: '1px solid #ffccc7' }}>
                        <Text type="secondary">Unpaid</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#cf1322' }}>
                            {invoices.filter(i => i.paymentStatus === 'Unpaid').length}
                        </Text></div>
                    </Card>
                </div>

                <Table
                    columns={columns}
                    dataSource={invoices}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                        emptyText: (
                            <Empty description="No invoices yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ),
                    }}
                />
            </Card>

            <Modal
                title={`Invoice ${selectedInvoice?.invoiceNumber}`}
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                width={700}
                footer={[
                    <Button key="close" onClick={() => setDetailOpen(false)}>Close</Button>,
                    <Button
                        key="email"
                        type="primary"
                        icon={<MailOutlined />}
                        loading={sendingEmail === selectedInvoice?.id}
                        onClick={() => {
                            if (selectedInvoice) {
                                handleSendEmail(selectedInvoice.id, selectedInvoice.invoiceNumber)
                                setDetailOpen(false)
                            }
                        }}
                    >
                        Send to {selectedInvoice?.customerEmail}
                    </Button>,
                ]}
            >
                {selectedInvoice && (
                    <>
                        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Invoice #">{selectedInvoice.invoiceNumber}</Descriptions.Item>
                            <Descriptions.Item label="Date">{dayjs(selectedInvoice.invoiceDate).format('DD MMM YYYY')}</Descriptions.Item>
                            <Descriptions.Item label="Customer">{selectedInvoice.customerName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedInvoice.customerEmail}</Descriptions.Item>
                            <Descriptions.Item label="Staff">{selectedInvoice.staffName}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={selectedInvoice.paymentStatus === 'Paid' ? 'green' : 'red'}>
                                    {selectedInvoice.paymentStatus}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <Table
                            columns={lineItemColumns}
                            dataSource={selectedInvoice.items}
                            rowKey="partName"
                            pagination={false}
                            size="small"
                            style={{ marginBottom: 16 }}
                        />

                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Subtotal">£{selectedInvoice.subtotal.toLocaleString()}</Descriptions.Item>
                            {selectedInvoice.loyaltyDiscount && (
                                <Descriptions.Item label="Loyalty Discount">
                                    <Text type="success">-£{selectedInvoice.loyaltyDiscount.toLocaleString()}</Text>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Final Total">
                                <Text strong style={{ fontSize: 16 }}>£{selectedInvoice.finalTotal.toLocaleString()}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </>
                )}
            </Modal>
        </>
    )
}