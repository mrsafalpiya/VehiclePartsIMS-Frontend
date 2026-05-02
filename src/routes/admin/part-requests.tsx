import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Select,
    Tag,
    Typography,
    Space,
    Tabs,
    message,
    Tooltip,
    Badge,
    Alert,
} from 'antd';
import {
    ReloadOutlined,
    EditOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

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

type PartRequestStatus = 0 | 1; // Pending = 0, Done = 1

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
        throw new Error(
            `Network error — is the backend running at ${BASE_URL}? (${String(networkErr)})`,
        );
    }

    const text = await res.text();

    if (!text) {
        if (res.status === 401) throw new Error('Unauthorized — please log in again');
        if (res.status === 403) throw new Error('Forbidden — you do not have permission');
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

async function apiGetAllRequests(): Promise<PartRequestResponseDto[]> {
    return apiFetch<PartRequestResponseDto[]>('/PartRequest');
}

async function apiGetPendingRequests(): Promise<PartRequestResponseDto[]> {
    return apiFetch<PartRequestResponseDto[]>('/PartRequest/pending');
}

async function apiUpdateRequestStatus(payload: {
    id: number;
    status: PartRequestStatus;
}): Promise<PartRequestResponseDto> {
    return apiFetch<PartRequestResponseDto>('/PartRequest/status', {
        method: 'PUT',
        body:   JSON.stringify(payload),
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/admin/part-requests')({
    component: AdminPartRequestPage,
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

function AdminPartRequestPage() {
    // Data
    const [allRequests, setAllRequests]         = useState<PartRequestResponseDto[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PartRequestResponseDto[]>([]);
    const [loading, setLoading]                 = useState(false);
    const [fetchError, setFetchError]           = useState<string | null>(null);
    const [activeTab, setActiveTab]             = useState('pending'); // default to pending

    // Update status modal
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PartRequestResponseDto | null>(null);
    const [newStatus, setNewStatus]             = useState<PartRequestStatus>(0);
    const [updatingStatus, setUpdatingStatus]   = useState(false);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [all, pending] = await Promise.all([
                apiGetAllRequests(),
                apiGetPendingRequests(),
            ]);
            setAllRequests(all);
            setPendingRequests(pending);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load part requests';
            setFetchError(msg);
            message.error(msg, 6);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Update Status ──────────────────────────────────────────────────────────
    const openStatusModal = (record: PartRequestResponseDto) => {
        setSelectedRequest(record);
        setNewStatus(normalizeStatus(record.status) === 'Done' ? 1 : 0);
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;
        setUpdatingStatus(true);
        try {
            const payload = { id: selectedRequest.id, status: newStatus };
            console.log('PUT /api/PartRequest/status:', payload);
            await apiUpdateRequestStatus(payload);
            message.success('Status updated successfully!');
            setStatusModalOpen(false);
            setSelectedRequest(null);
            fetchAll();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update status';
            message.error(msg, 6);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // ── Stats ──────────────────────────────────────────────────────────────────
    const doneCount    = allRequests.filter(r => normalizeStatus(r.status) === 'Done').length;
    const pendingCount = allRequests.filter(r => normalizeStatus(r.status) === 'Pending').length;

    // ── Table Columns ──────────────────────────────────────────────────────────
    const columns = [
        {
            title:     'ID',
            dataIndex: 'id',
            key:       'id',
            width:     60,
        },
        {
            title:     'Customer',
            dataIndex: 'customerName',
            key:       'customerName',
            render:    (name: string) => <Text strong>{name}</Text>,
        },
        {
            title:     'Part Requested',
            dataIndex: 'partName',
            key:       'partName',
            render:    (name: string) => <Tag color="blue">{name}</Tag>,
        },
        {
            title:     'Notes',
            dataIndex: 'notes',
            key:       'notes',
            render:    (notes: string) =>
                notes ? (
                    <Tooltip title={notes}>
                        <Text type="secondary" ellipsis style={{ maxWidth: 180, display: 'block' }}>
                            {notes}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title:     'Status',
            dataIndex: 'status',
            key:       'status',
            width:     110,
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'Done',    value: 'Done'    },
            ],
            onFilter: (value: unknown, record: PartRequestResponseDto) =>
                normalizeStatus(record.status) === value,
            render: (status: string) => <StatusTag status={status} />,
        },
        {
            title:     'Requested On',
            dataIndex: 'createdAt',
            key:       'createdAt',
            width:     140,
            render:    (date: string) =>
                new Date(date).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                }),
        },
        {
            title:  'Action',
            key:    'action',
            width:  110,
            render: (_: unknown, record: PartRequestResponseDto) => {
                const isDone = normalizeStatus(record.status) === 'Done';
                return (
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type={isDone ? 'default' : 'primary'}
                        disabled={isDone}
                        onClick={() => openStatusModal(record)}
                    >
                        {isDone ? 'Fulfilled' : 'Mark Done'}
                    </Button>
                );
            },
        },
    ];

    // ── Tab Items ──────────────────────────────────────────────────────────────
    const tabItems = [
        {
            key: 'pending',
            label: (
                <span>
                    Pending
                    <Badge count={pendingCount} color="orange" style={{ marginLeft: 8 }} />
                </span>
            ),
            children: (
                <Table
                    columns={columns}
                    dataSource={pendingRequests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: '✅ No pending requests — all caught up!' }}
                />
            ),
        },
        {
            key: 'all',
            label: (
                <span>
                    All Requests
                    <Badge count={allRequests.length} color="blue" style={{ marginLeft: 8 }} />
                </span>
            ),
            children: (
                <Table
                    columns={columns}
                    dataSource={allRequests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No part requests found.' }}
                />
            ),
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
                    alignItems:     'flex-start',
                    marginBottom:   24,
                }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Part Requests</Title>
                        <Text type="secondary">
                            Review and fulfil customer requests for unavailable parts
                        </Text>
                    </div>
                    <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
                        Refresh
                    </Button>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <Card size="small" style={{
                        flex: 1, textAlign: 'center',
                        background: '#fffbe6', border: '1px solid #ffe58f',
                    }}>
                        <Text type="secondary">Pending</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#d48806' }}>
                                {pendingCount}
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Need attention</Text>
                    </Card>
                    <Card size="small" style={{
                        flex: 1, textAlign: 'center',
                        background: '#f6ffed', border: '1px solid #b7eb8f',
                    }}>
                        <Text type="secondary">Fulfilled</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#389e0d' }}>
                                {doneCount}
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Completed</Text>
                    </Card>
                    <Card size="small" style={{
                        flex: 1, textAlign: 'center',
                        background: '#e6f4ff', border: '1px solid #91caff',
                    }}>
                        <Text type="secondary">Total</Text>
                        <div>
                            <Text strong style={{ fontSize: 28, color: '#1677ff' }}>
                                {allRequests.length}
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>All time</Text>
                    </Card>
                </div>

                {/* Error banner */}
                {fetchError && (
                    <Alert
                        message="Failed to load requests"
                        description={fetchError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setFetchError(null)}
                        style={{ marginBottom: 16 }}
                        action={
                            <Button size="small" onClick={fetchAll}>Retry</Button>
                        }
                    />
                )}

                {/* Tabs — default to Pending so admin sees urgent items first */}
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Card>

            {/* ── Update Status Modal ── */}
            <Modal
                title="Mark Request as Done"
                open={statusModalOpen}
                onCancel={() => { setStatusModalOpen(false); setSelectedRequest(null); }}
                onOk={handleUpdateStatus}
                okText="Update Status"
                confirmLoading={updatingStatus}
                okButtonProps={{ icon: <CheckCircleOutlined /> }}
            >
                {selectedRequest && (
                    <div style={{ marginTop: 16 }}>
                        {/* Request summary */}
                        <div style={{
                            background:   '#fafafa',
                            border:       '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding:      '12px 16px',
                            marginBottom: 20,
                        }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Part Requested</Text>
                            <div>
                                <Text strong style={{ fontSize: 15 }}>
                                    {selectedRequest.partName}
                                </Text>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary">by {selectedRequest.customerName}</Text>
                            </div>
                            {selectedRequest.notes && (
                                <div style={{ marginTop: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Note: {selectedRequest.notes}
                                    </Text>
                                </div>
                            )}
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Current status:{' '}
                                </Text>
                                <StatusTag status={selectedRequest.status} />
                            </div>
                        </div>

                        {/* Status selector */}
                        <Form layout="vertical">
                            <Form.Item label="Update Status" required>
                                <Select
                                    value={newStatus}
                                    onChange={v => setNewStatus(v)}
                                    style={{ width: '100%' }}
                                >
                                    <Option value={0}>
                                        <Space>
                                            <ClockCircleOutlined style={{ color: 'orange' }} />
                                            Pending
                                        </Space>
                                    </Option>
                                    <Option value={1}>
                                        <Space>
                                            <CheckCircleOutlined style={{ color: 'green' }} />
                                            Done — Part is now available
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </>
    );
}