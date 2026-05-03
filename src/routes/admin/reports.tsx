import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
    Card, Table, Tag, Typography, Button, Form,
    Select, DatePicker, Tabs, message, Alert, Descriptions,
} from 'antd'
import {
    SearchOutlined, ReloadOutlined,
    ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

interface TransactionItemDto {
    type: string
    invoiceNumber: string
    date: string
    description: string
    amount: number
}

interface FinancialReportDto {
    reportType: string
    period: string
    totalRevenue: number
    totalExpenditure: number
    netProfit: number
    transactions: TransactionItemDto[]
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

export const Route = createFileRoute('/admin/reports')({
    component: AdminFinancialReportsPage,
})

function AdminFinancialReportsPage() {
    const [form] = Form.useForm()
    const [reportType, setReportType] = useState<'Daily' | 'Monthly' | 'Yearly'>('Monthly')
    const [report, setReport]         = useState<FinancialReportDto | null>(null)
    const [loading, setLoading]       = useState(false)
    const [error, setError]           = useState<string | null>(null)

    const fetchReport = async () => {
        let values: any
        try { values = await form.validateFields() } catch { return }

        setLoading(true)
        setError(null)
        try {
            let path = ''
            if (reportType === 'Daily') {
                path = `/Report/daily?date=${values.date.format('YYYY-MM-DD')}`
            } else if (reportType === 'Monthly') {
                path = `/Report/monthly?month=${values.month.month() + 1}&year=${values.month.year()}`
            } else {
                path = `/Report/yearly?year=${values.year.year()}`
            }
            const data = await apiFetch<FinancialReportDto>(path)
            setReport(data)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to generate report'
            setError(msg)
            message.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const transactionColumns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (t: string) => (
                <Tag color={t === 'Sale' ? 'green' : 'red'}
                     icon={t === 'Sale' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
                    {t}
                </Tag>
            ),
        },
        {
            title: 'Invoice #',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (n: string) => <Text strong style={{ color: '#1677ff' }}>{n}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d: string) => dayjs(d).format('DD MMM YYYY'),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (a: number, record: TransactionItemDto) => (
                <Text strong style={{ color: record.type === 'Sale' ? '#389e0d' : '#cf1322' }}>
                    {record.type === 'Sale' ? '+' : '-'}£{a.toLocaleString()}
                </Text>
            ),
        },
    ]

    const tabItems = [
        {
            key: 'summary',
            label: 'Summary',
            children: report ? (
                <Descriptions bordered column={3} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Report Type">
                        <Tag color="blue">{report.reportType}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Period">
                        <Text strong>{report.period}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Transactions">
                        {report.transactions.length}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Revenue">
                        <Text strong style={{ color: '#389e0d', fontSize: 18 }}>
                            £{report.totalRevenue.toLocaleString()}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Expenditure">
                        <Text strong style={{ color: '#cf1322', fontSize: 18 }}>
                            £{report.totalExpenditure.toLocaleString()}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Net Profit">
                        <Text strong style={{
                            color: report.netProfit >= 0 ? '#389e0d' : '#cf1322',
                            fontSize: 18
                        }}>
                            {report.netProfit >= 0 ? '+' : ''}£{report.netProfit.toLocaleString()}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Text type="secondary">Generate a report to see the summary.</Text>
            ),
        },
        {
            key: 'transactions',
            label: `Transactions ${report ? `(${report.transactions.length})` : ''}`,
            children: (
                <Table
                    columns={transactionColumns}
                    dataSource={report?.transactions ?? []}
                    rowKey="invoiceNumber"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    locale={{ emptyText: 'Generate a report to see transactions.' }}
                />
            ),
        },
    ]

    return (
        <Card style={{ margin: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Financial Reports</Title>
                    <Text type="secondary">Generate daily, monthly, or yearly financial reports</Text>
                </div>
                {report && (
                    <Button icon={<ReloadOutlined />} onClick={() => setReport(null)}>
                        Clear Report
                    </Button>
                )}
            </div>

            <Card size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
                <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <Form.Item name="reportType" initialValue="Monthly" label="Report Type">
                        <Select
                            style={{ width: 130 }}
                            onChange={(v) => { setReportType(v); form.resetFields(['date', 'month', 'year']) }}
                        >
                            <Option value="Daily">Daily</Option>
                            <Option value="Monthly">Monthly</Option>
                            <Option value="Yearly">Yearly</Option>
                        </Select>
                    </Form.Item>

                    {reportType === 'Daily' && (
                        <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Select a date' }]}>
                            <DatePicker format="DD MMM YYYY" />
                        </Form.Item>
                    )}

                    {reportType === 'Monthly' && (
                        <Form.Item name="month" label="Month" rules={[{ required: true, message: 'Select a month' }]}>
                            <DatePicker picker="month" format="MMMM YYYY" />
                        </Form.Item>
                    )}

                    {reportType === 'Yearly' && (
                        <Form.Item name="year" label="Year" rules={[{ required: true, message: 'Select a year' }]}>
                            <DatePicker picker="year" format="YYYY" />
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Button type="primary" icon={<SearchOutlined />} onClick={fetchReport} loading={loading}>
                            Generate Report
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {error && (
                <Alert
                    message="Failed to generate report"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            {report && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text type="secondary">Total Revenue</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#389e0d' }}>£{report.totalRevenue.toLocaleString()}</Text></div>
                        <Text type="secondary" style={{ fontSize: 12 }}>From sales</Text>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff2f0', border: '1px solid #ffccc7' }}>
                        <Text type="secondary">Total Expenditure</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#cf1322' }}>£{report.totalExpenditure.toLocaleString()}</Text></div>
                        <Text type="secondary" style={{ fontSize: 12 }}>From purchases</Text>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: report.netProfit >= 0 ? '#e6f4ff' : '#fff2f0', border: `1px solid ${report.netProfit >= 0 ? '#91caff' : '#ffccc7'}` }}>
                        <Text type="secondary">Net Profit</Text>
                        <div><Text strong style={{ fontSize: 28, color: report.netProfit >= 0 ? '#1677ff' : '#cf1322' }}>
                            {report.netProfit >= 0 ? '+' : ''}£{report.netProfit.toLocaleString()}
                        </Text></div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Revenue - Expenditure</Text>
                    </Card>
                </div>
            )}

            <Tabs items={tabItems} />
        </Card>
    )
}