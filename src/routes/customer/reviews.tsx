import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Modal, Form, Input, Rate,
    Typography, Space, message, Empty, Tag,
} from 'antd'
import { PlusOutlined, ReloadOutlined, StarOutlined } from '@ant-design/icons'
import { useAuth } from '#/context/AuthContext'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

interface ServiceReviewResponseDto {
    id: number
    customerId: number
    customerName: string
    starRating: number
    comment: string
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

export const Route = createFileRoute('/customer/reviews')({
    component: CustomerReviewsPage,
})

function StarTag({ rating }: { rating: number }) {
    const color =
        rating >= 4 ? 'green' : rating === 3 ? 'orange' : 'red'
    return <Tag color={color}>{rating} ★</Tag>
}

function CustomerReviewsPage() {
   //  const { currentUser } = useAuth()
    // const customerId = Number((currentUser as any)?.id ?? 0)
    useAuth()
    const customerId = 1 // TODO: replace with real JWT customer id
    const [form] = Form.useForm()
    const [reviews, setReviews]       = useState<ServiceReviewResponseDto[]>([])
    const [loading, setLoading]       = useState(false)
    const [modalOpen, setModalOpen]   = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const fetchReviews = async () => {
        setLoading(true)
        try {
            const data = await apiFetch<ServiceReviewResponseDto[]>(
                `/ServiceReview/my?customerId=${customerId}`
            )
            setReviews(data ?? [])
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to load reviews')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (customerId) fetchReviews() }, [customerId])

    const handleSubmit = async () => {
        let values: { starRating: number; comment: string }
        try { values = await form.validateFields() } catch { return }

        setSubmitting(true)
        try {
            await apiFetch(`/ServiceReview?customerId=${customerId}`, {
                method: 'POST',
                body: JSON.stringify({
                    starRating: values.starRating,
                    comment: values.comment,
                }),
            })
            message.success('Review submitted successfully!')
            form.resetFields()
            setModalOpen(false)
            fetchReviews()
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to submit review')
        } finally {
            setSubmitting(false)
        }
    }

    const avgRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length).toFixed(1)
            : '—'

    const columns = [
        {
            title: 'Rating',
            dataIndex: 'starRating',
            key: 'starRating',
            width: 100,
            render: (r: number) => <StarTag rating={r} />,
        },
        {
            title: 'Comment',
            dataIndex: 'comment',
            key: 'comment',
            render: (c: string) => <Text>{c}</Text>,
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (d: string) => dayjs(d).format('DD MMM YYYY'),
        },
    ]

    return (
        <>
            <Card style={{ margin: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>My Reviews</Title>
                        <Text type="secondary">Share your experience with our service</Text>
                    </div>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchReviews} loading={loading}>Refresh</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                            Write a Review
                        </Button>
                    </Space>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f' }}>
                        <Text type="secondary">Total Reviews</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#d48806' }}>{reviews.length}</Text></div>
                        <Text type="secondary" style={{ fontSize: 12 }}>All time</Text>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text type="secondary">Average Rating</Text>
                        <div><Text strong style={{ fontSize: 28, color: '#389e0d' }}>{avgRating}</Text></div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Out of 5</Text>
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Text type="secondary">5 Star Reviews</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#1677ff' }}>
                                {reviews.filter(r => r.starRating === 5).length}
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Excellent ratings</Text>
                    </Card>
                </div>

                <Table
                    columns={columns}
                    dataSource={reviews}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                        emptyText: (
                            <Empty description="No reviews yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                                <Button type="primary" icon={<StarOutlined />} onClick={() => setModalOpen(true)}>
                                    Write a Review
                                </Button>
                            </Empty>
                        ),
                    }}
                />
            </Card>

            <Modal
                title="Write a Service Review"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields() }}
                onOk={handleSubmit}
                okText="Submit Review"
                confirmLoading={submitting}
                okButtonProps={{ icon: <StarOutlined /> }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    How was your experience with our service?
                </Text>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="starRating"
                        label="Star Rating"
                        rules={[{ required: true, message: 'Please give a star rating' }]}
                    >
                        <Rate />
                    </Form.Item>
                    <Form.Item
                        name="comment"
                        label="Your Comment"
                        rules={[
                            { required: true, message: 'Please write a comment' },
                            { min: 5, message: 'Comment must be at least 5 characters' },
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tell us about your experience..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}