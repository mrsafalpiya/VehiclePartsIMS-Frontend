import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Tag,
    Typography,
    Space,
    message,
    Empty,
    Badge,
} from 'antd';
import {
    PlusOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartRequestResponseDto {
    id: number;
    customerId: number;
    customerName: string;
    partName: string;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5154/api';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...(options?.headers ?? {}),
            },
        });
    } catch (networkErr) {
        throw new Error(`Network error — is the backend running? (${String(networkErr)})`);
    }

    const text = await res.text();

    if (!text) {
        if (res.status === 401) throw new Error('Unauthorized — please log in again');
        if (res.status === 403) throw new Error('Forbidden');
        if (!res.ok)            throw new Error(`Server error ${res.status}`);
        return undefined as T;
    }

    let json: { success?: boolean; message?: string; data?: T } | null = null;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(`Server returned ${res.status} with non-JSON body: ${text}`);
    }

    if (res.status === 401) throw new Error('Unauthorized — please log in again');
    if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Server error ${res.status}`);
    }

    return json?.data as T;
}

async function apiGetMyRequests(customerId: number): Promise<PartRequestResponseDto[]> {
    return apiFetch<PartRequestResponseDto[]>(`/PartRequest/customer/${customerId}`);
}

async function apiCreatePartRequest(payload: {
    customerId: number;
    partName: string;
    notes?: string;
}): Promise<PartRequestResponseDto> {
    return apiFetch<PartRequestResponseDto>('/PartRequest', {
        method: 'POST',
        body:   JSON.stringify(payload),
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/customer/request-part')({
    component: CustomerPartRequestPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(status: string): 'Pending' | 'Done' {
    if (status === 'Done' || status === '1') return 'Done';
    return 'Pending';
}

function StatusTag({ status }: { status: string }) {
    const normalized = normalizeStatus(status);
    if (normalized === 'Done') {
        return <Tag color="green" icon={<CheckCircleOutlined />}>Done</Tag>;
    }
    return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
}

// ─── Component ────────────────────────────────────────────────────────────────

function CustomerPartRequestPage() {
    const [form] = Form.useForm();

    // Hardcoded for now — replace with useAuth() once auth is wired up
    // const { currentUser } = useAuth();
    // const customerId = currentUser?.id;
    const CURRENT_CUSTOMER_ID = 2; // John Customer — change to real logged-in customer id

    const [requests, setRequests]           = useState<PartRequestResponseDto[]>([]);
    const [loading, setLoading]             = useState(false);
    const [modalOpen, setModalOpen]         = useState(false);
    const [submitting, setSubmitting]       = useState(false);

    // ── Fetch my requests ──────────────────────────────────────────────────────
    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const data = await apiGetMyRequests(CURRENT_CUSTOMER_ID);
            setRequests(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load your requests';
            message.error(msg, 6);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyRequests(); }, []);

    // ── Submit new request ─────────────────────────────────────────────────────
    const handleSubmit = async () => {
        let values: { partName: string; notes?: string };
        try {
            values = await form.validateFields();
        } catch {
            return; // antd shows inline errors
        }

        setSubmitting(true);
        try {
            const payload = {
                customerId: CURRENT_CUSTOMER_ID,
                partName:   values.partName,
                notes:      values.notes?.trim() || undefined,
            };
            console.log('POST /api/PartRequest:', payload);
            const created = await apiCreatePartRequest(payload);

            message.success(`Your request for "${created.partName}" has been submitted!`);
            form.resetFields();
            setModalOpen(false);
            fetchMyRequests();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to submit request';
            message.error(msg, 6);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Stats ──────────────────────────────────────────────────────────────────
    const pendingCount = requests.filter(r => normalizeStatus(r.status) === 'Pending').length;
    const doneCount    = requests.filter(r => normalizeStatus(r.status) === 'Done').length;

    // ── Columns ────────────────────────────────────────────────────────────────
    const columns = [
        {
            title:     'Part Requested',
            dataIndex: 'partName',
            key:       'partName',
            render:    (name: string) => <Text strong>{name}</Text>,
        },
        {
            title:     'Notes',
            dataIndex: 'notes',
            key:       'notes',
            render:    (notes: string) =>
                notes
                    ? <Text type="secondary">{notes}</Text>
                    : <Text type="secondary">—</Text>,
        },
        {
            title:     'Status',
            dataIndex: 'status',
            key:       'status',
            width:     110,
            render:    (status: string) => <StatusTag status={status} />,
        },
        {
            title:  'Requested On',
            dataIndex: 'createdAt',
            key:    'createdAt',
            width:  140,
            render: (date: string) =>
                new Date(date).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                }),
        },
        {
            title:  'Last Updated',
            dataIndex: 'updatedAt',
            key:    'updatedAt',
            width:  140,
            render: (date?: string) =>
                date
                    ? new Date(date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })
                    : <Text type="secondary">—</Text>,
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Card style={{ margin: 24 }}>
                {/* Header */}
                <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   24,
                }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>My Part Requests</Title>
                        <Text type="secondary">
                            Can't find a part in our inventory? Request it and we'll source it for you.
                        </Text>
                    </div>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchMyRequests}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalOpen(true)}
                        >
                            Request a Part
                        </Button>
                    </Space>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f' }}>
                        <Text type="secondary">Pending</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#d48806' }}>
                                {pendingCount}
                            </Text>
                        </div>
                        <Badge color="orange" text="Awaiting response" />
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Text type="secondary">Fulfilled</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#389e0d' }}>
                                {doneCount}
                            </Text>
                        </div>
                        <Badge color="green" text="Part is available" />
                    </Card>
                    <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Text type="secondary">Total Requests</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#1677ff' }}>
                                {requests.length}
                            </Text>
                        </div>
                        <Badge color="blue" text="All time" />
                    </Card>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                        emptyText: (
                            <Empty
                                description="You haven't requested any parts yet"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setModalOpen(true)}
                                >
                                    Request a Part
                                </Button>
                            </Empty>
                        ),
                    }}
                />
            </Card>

            {/* ── Request Modal ── */}
            <Modal
                title="Request an Unavailable Part"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSubmit}
                okText="Submit Request"
                confirmLoading={submitting}
                okButtonProps={{ icon: <PlusOutlined /> }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Tell us what part you need and we'll try to source it for you.
                </Text>

                <Form form={form} layout="vertical">
                    <Form.Item
                        name="partName"
                        label="Part Name"
                        rules={[
                            { required: true, message: 'Please enter the part name'              },
                            { min: 2,         message: 'Part name must be at least 2 characters' },
                        ]}
                    >
                        <Input
                            placeholder="e.g. Clutch Plate, Radiator Cap, Timing Belt..."
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="notes" label="Additional Details (optional)">
                        <TextArea
                            rows={4}
                            placeholder="Include any details like your vehicle model, year, or part specifications..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}