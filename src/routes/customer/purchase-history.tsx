import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
    Card, Table, Tag, Typography, Button,
    message, Empty, Descriptions,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface SalesInvoiceLineItemDto {
    partName: string
    quantity: number
    unitSellingPrice: number
    lineTotal: number
}

interface PurchaseHistoryItemDto {
    id: number
    invoiceNumber: string
    invoiceDate: string
    lineItems: SalesInvoiceLineItemDto[]
    subtotal: number
    loyaltyDiscount?: number
    finalTotal: number
    paymentStatus: string
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

export const Route = createFileRoute('/customer/purchase-history')({
    component: CustomerPurchaseHistoryPage,
})

function CustomerPurchaseHistoryPage() {
    const customerId = 1 // TODO: replace with real JWT customer id
    const [invoices, setInvoices] = useState<PurchaseHistoryItemDto[]>([])
    const [loading, setLoading]   = useState(false)

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const data = await apiFetch<PurchaseHistoryItemDto[]>(
                `/History/purchases?customerId=${customerId}`
            )
            setInvoices(data ?? [])
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to load purchase history')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchHistory() }, [])

    const totalSpent  = invoices.reduce((sum, i) => sum + i.finalTotal, 0)
    const unpaidCount = invoices.filter(i => i.paymentStatus === 'Unpaid').length

    const lineItemColumns = [
        {
            title: 'Part',
            dataIndex: 'partName',
            key: 'partName',
            render: (name: string) => <Text strong>{name}</Text>,
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
            width: 120,
            render: (p: number) => `£${p.toLocaleString()}`,
        },
        {
            title: 'Line Total',
            dataIndex: 'lineTotal',
            key: 'lineTotal',
            width: 120,
            render: (t: number) => <Text strong>£{t.toLocaleString()}</Text>,
        },
    ]

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
            title: 'Items',
            dataIndex: 'lineItems',
            key: 'lineItems',
            render: (items: SalesInvoiceLineItemDto[]) => (
                <Text type="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
            ),
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            render: (s: number) => `£${s.toLocaleString()}`,
        },
        {
            title: 'Discount',
            dataIndex: 'loyaltyDiscount',
            key: 'loyaltyDiscount',
            render: (d?: number) =>
                d ? <Tag color="green">-£{d.toLocaleString()}</Tag> : <Text type="secondary">—</Text>,
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
    ]

    return (
        <Card style={{ margin: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Purchase History</Title>
                    <Text type="secondary">All your invoices and purchases</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>
                    Refresh
                </Button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#e6f4ff', border: '1px solid #91caff' }}>
                    <Text type="secondary">Total Purchases</Text>
                    <div><Text strong style={{ fontSize: 28, color: '#1677ff' }}>{invoices.length}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>All invoices</Text>
                </Card>
                <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Text type="secondary">Total Spent</Text>
                    <div><Text strong style={{ fontSize: 28, color: '#389e0d' }}>£{totalSpent.toLocaleString()}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>All time</Text>
                </Card>
                <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff2f0', border: '1px solid #ffccc7' }}>
                    <Text type="secondary">Unpaid</Text>
                    <div><Text strong style={{ fontSize: 28, color: '#cf1322' }}>{unpaidCount}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Pending payment</Text>
                </Card>
            </div>

            <Table
                columns={columns}
                dataSource={invoices}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                expandable={{
                    expandedRowRender: (record) => (
                        <div style={{ margin: '0 16px 16px' }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Invoice Details</Text>
                            <Table
                                columns={lineItemColumns}
                                dataSource={record.lineItems}
                                rowKey="partName"
                                pagination={false}
                                size="small"
                                style={{ marginBottom: 12 }}
                            />
                            <Descriptions size="small" column={3} bordered>
                                <Descriptions.Item label="Subtotal">£{record.subtotal.toLocaleString()}</Descriptions.Item>
                                {record.loyaltyDiscount && (
                                    <Descriptions.Item label="Loyalty Discount">
                                        <Text type="success">-£{record.loyaltyDiscount.toLocaleString()}</Text>
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Final Total">
                                    <Text strong>£{record.finalTotal.toLocaleString()}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    ),
                }}
                locale={{
                    emptyText: (
                        <Empty
                            description="No purchase history yet"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ),
                }}
            />
        </Card>
    )
}