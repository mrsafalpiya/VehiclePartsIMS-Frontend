import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
    Form,
    Button,
    Table,
    Select,
    InputNumber,
    Card,
    message,
    Space,
    Typography,
    Descriptions,
    Modal,
    Spin,
    Tag,
    Alert,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    ShoppingCartOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Part {
    id: number;
    partName: string;
    partCode: string;
    stockQuantity: number;
    sellingPrice: number;  // IN RUPEES (e.g., 5000 = ₹5,000)
    vendorId: number;
}

interface Vendor {
    id: number;
    vendorName: string;
    contactPersonName: string;
    email: string;
    phoneNumber: string;
    address: string;
}

interface CartItem {
    key: string;
    partId: number;
    partName: string;
    partCode: string;
    quantity: number;
    unitCostPrice: number;  // IN RUPEES
    totalPrice: number;     // IN RUPEES
}

interface PurchaseInvoiceResponseDto {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    vendorName: string;
    totalAmount: number;    // IN RUPEES
    items: {
        partName: string;
        quantity: number;
        unitCostPrice: number;  // IN RUPEES
        totalPrice: number;     // IN RUPEES
    }[];
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const formatRupees = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5154/api';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetchWrapped<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) },
        });
    } catch (err) {
        throw new Error(`Network error — is the backend running? (${String(err)})`);
    }

    const text = await res.text();
    if (!text) {
        if (res.status === 401) throw new Error('Unauthorized — please log in again');
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return undefined as T;
    }

    let json: { success?: boolean; message?: string; data?: T } | null = null;
    try { json = JSON.parse(text); } catch {
        throw new Error(`Non-JSON response ${res.status}: ${text}`);
    }

    if (res.status === 401) throw new Error('Unauthorized — please log in again');
    if (!res.ok || json?.success === false)
        throw new Error(json?.message || `Server error ${res.status}`);

    return json?.data as T;
}

async function apiFetchDirect<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) },
        });
    } catch (err) {
        throw new Error(`Network error — is the backend running? (${String(err)})`);
    }

    const text = await res.text();
    if (!text) {
        if (res.status === 401) throw new Error('Unauthorized — please log in again');
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return undefined as T;
    }

    let json: T | null = null;
    try { json = JSON.parse(text); } catch {
        throw new Error(`Non-JSON response ${res.status}: ${text}`);
    }

    if (res.status === 401) throw new Error('Unauthorized — please log in again');
    if (!res.ok) throw new Error(`Server error ${res.status}`);

    return json as T;
}

async function apiGetVendors(): Promise<Vendor[]> {
    return apiFetchDirect<Vendor[]>('/Vendor');
}

async function apiGetParts(): Promise<Part[]> {
    return apiFetchDirect<Part[]>('/Part');
}

async function apiCreatePurchaseInvoice(payload: {
    vendorId: number;
    items: { partId: number; quantity: number; unitCostPrice: number }[];
}): Promise<PurchaseInvoiceResponseDto> {
    return apiFetchWrapped<PurchaseInvoiceResponseDto>('/PurchaseInvoice', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/admin/purchase-invoices')({
    component: PurchaseInvoicePage,
});

// ─── Component ────────────────────────────────────────────────────────────────

function PurchaseInvoicePage() {
    const [form] = Form.useForm();

    // Data
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>();

    // Cart
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedPart, setSelectedPart] = useState<number | undefined>();
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

    // Submit
    const [submitting, setSubmitting] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [generatedInvoice, setGeneratedInvoice] = useState<PurchaseInvoiceResponseDto | null>(null);

    // ── Load vendors and parts from real API ───────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [vendorsData, partsData] = await Promise.all([
                apiGetVendors(),
                apiGetParts(),
            ]);
            setVendors(vendorsData);
            setParts(partsData);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load data';
            setLoadError(msg);
            message.error(msg, 6);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // ── Derived ────────────────────────────────────────────────────────────────
    const filteredParts = selectedVendorId
        ? parts.filter(p => p.vendorId === selectedVendorId)
        : [];

    const getPartById = (id: number) => parts.find(p => p.id === id);

    // ── Vendor change ──────────────────────────────────────────────────────────
    const handleVendorChange = (vendorId: number) => {
        setSelectedVendorId(vendorId);
        setSelectedPart(undefined);
        setCartItems([]);
    };

    // ── Add to cart ────────────────────────────────────────────────────────────
    const addToCart = () => {
        if (!selectedPart) { message.warning('Please select a part'); return; }
        if (!selectedQuantity || selectedQuantity < 1) { message.warning('Quantity must be at least 1'); return; }

        const part = getPartById(selectedPart);
        if (!part) return;

        // FIXED: No division - prices are already in rupees
        const unitCost = part.sellingPrice;
        const itemTotal = selectedQuantity * unitCost;

        // Check if adding this quantity exceeds stock
        const existingItem = cartItems.find(item => item.partId === selectedPart);
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
        const newTotalQuantity = currentQuantityInCart + selectedQuantity;

        if (newTotalQuantity > part.stockQuantity) {
            message.warning(`Only ${part.stockQuantity} units available in stock. You already have ${currentQuantityInCart} in cart.`);
            return;
        }

        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.partId === selectedPart);
            if (existingIndex !== -1) {
                return prev.map((item, idx) =>
                    idx === existingIndex
                        ? {
                            ...item,
                            quantity: item.quantity + selectedQuantity,
                            totalPrice: (item.quantity + selectedQuantity) * unitCost,
                        }
                        : item
                );
            }
            return [...prev, {
                key: Date.now().toString(),
                partId: part.id,
                partName: part.partName,
                partCode: part.partCode,
                quantity: selectedQuantity,
                unitCostPrice: unitCost,
                totalPrice: itemTotal,
            }];
        });

        setSelectedPart(undefined);
        setSelectedQuantity(1);
        message.success(`${part.partName} added to cart`);
    };

    const removeFromCart = (key: string) =>
        setCartItems(prev => prev.filter(item => item.key !== key));

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedVendorId) { message.error('Please select a vendor'); return; }
        if (cartItems.length === 0) { message.error('Please add at least one part'); return; }

        setSubmitting(true);
        try {
            const payload = {
                vendorId: selectedVendorId,
                items: cartItems.map(item => ({
                    partId: item.partId,
                    quantity: item.quantity,
                    unitCostPrice: item.unitCostPrice,
                })),
            };
            console.log('POST /api/PurchaseInvoice:', payload);

            const invoice = await apiCreatePurchaseInvoice(payload);
            setGeneratedInvoice(invoice);
            setInvoiceModalOpen(true);
            message.success(`Invoice ${invoice.invoiceNumber} created!`);

            form.resetFields();
            setSelectedVendorId(undefined);
            setCartItems([]);
            await loadData(); // refresh stock
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create invoice';
            message.error(msg, 6);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Columns ────────────────────────────────────────────────────────────────
    const cartColumns = [
        { title: 'Part Name', dataIndex: 'partName', key: 'partName' },
        { title: 'Code', dataIndex: 'partCode', key: 'partCode', width: 100 },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 70 },
        {
            title: 'Vendor Price (₹)',
            dataIndex: 'unitCostPrice',
            key: 'unitCostPrice',
            width: 150,
            render: (v: number) => formatRupees(v),
        },
        {
            title: 'Total (₹)',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 120,
            render: (v: number) => formatRupees(v),
        },
        {
            title: 'Action',
            key: 'action',
            width: 90,
            render: (_: unknown, record: CartItem) => (
                <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeFromCart(record.key)}>
                    Remove
                </Button>
            ),
        },
    ];

    const invoiceColumns = [
        { title: 'Part Name', dataIndex: 'partName', key: 'partName' },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 70 },
        {
            title: 'Unit Price (₹)',
            dataIndex: 'unitCostPrice',
            key: 'unitCostPrice',
            width: 130,
            render: (v: number) => formatRupees(v),
        },
        {
            title: 'Total (₹)',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 120,
            render: (v: number) => formatRupees(v),
        },
    ];

    const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <Spin size="large" tip="Loading vendors and parts..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <Card style={{ margin: 24 }}>
                <Alert
                    message="Failed to load data"
                    description={loadError}
                    type="error"
                    showIcon
                    action={<Button onClick={loadData}>Retry</Button>}
                />
            </Card>
        );
    }

    return (
        <>
            <Card style={{ margin: 24 }}>
                <Title level={2}>Create Purchase Invoice</Title>

                {/* Vendor */}
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="vendorId"
                        label="Select Vendor"
                        rules={[{ required: true, message: 'Please select a vendor' }]}
                    >
                        <Select
                            placeholder="Select a vendor"
                            showSearch
                            style={{ maxWidth: 420 }}
                            optionFilterProp="children"
                            onChange={handleVendorChange}
                            allowClear
                            onClear={() => {
                                setSelectedVendorId(undefined);
                                setSelectedPart(undefined);
                                setCartItems([]);
                            }}
                        >
                            {vendors.map(v => (
                                <Option key={v.id} value={v.id}>
                                    {v.vendorName} — {v.contactPersonName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>

                {/* Add Parts — only after vendor selected */}
                {selectedVendorId && (
                    <Card title="Add Parts from Vendor" size="small" style={{ marginTop: 16 }}>
                        {filteredParts.length === 0 ? (
                            <Text type="secondary">
                                No parts linked to this vendor. Add parts via Parts Management first.
                            </Text>
                        ) : (
                            <Space wrap align="end">
                                <div>
                                    <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Part</div>
                                    <Select
                                        placeholder="Select a part"
                                        style={{ width: 320 }}
                                        value={selectedPart}
                                        onChange={setSelectedPart}
                                        showSearch
                                        allowClear
                                        onClear={() => setSelectedPart(undefined)}
                                        optionFilterProp="children"
                                    >
                                        {filteredParts.map(part => (
                                            <Option key={part.id} value={part.id}>
                                                {part.partName} ({part.partCode}) — Stock: {part.stockQuantity} — {formatRupees(part.sellingPrice)}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Quantity</div>
                                    <InputNumber
                                        min={1}
                                        max={selectedPart ? getPartById(selectedPart)?.stockQuantity : undefined}
                                        value={selectedQuantity}
                                        onChange={v => setSelectedQuantity(v ?? 1)}
                                        style={{ width: 110 }}
                                    />
                                </div>

                                <div>
                                    <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>
                                        Vendor Price (₹)
                                    </div>
                                    <InputNumber
                                        value={selectedPart ? getPartById(selectedPart)?.sellingPrice : undefined}
                                        disabled
                                        style={{ width: 180, background: '#f5f5f5' }}
                                        formatter={value => (value ? `₹ ${value}` : '—')}
                                        placeholder="Select a part first"
                                    />
                                </div>

                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={addToCart}
                                    disabled={!selectedPart}
                                >
                                    Add to Cart
                                </Button>
                            </Space>
                        )}
                    </Card>
                )}

                {/* Cart */}
                <Table
                    columns={cartColumns}
                    dataSource={cartItems}
                    pagination={false}
                    rowKey="key"
                    style={{ marginTop: 16 }}
                    locale={{ emptyText: 'No parts added yet. Select a vendor and add parts above.' }}
                />

                {/* Total */}
                <div style={{
                    textAlign: 'right', margin: '16px 0',
                    padding: '12px 16px', background: '#fafafa',
                    borderRadius: 8, border: '1px solid #f0f0f0',
                }}>
                    <Text strong style={{ fontSize: 16 }}>
                        Total Purchase Amount: {formatRupees(totalAmount)}
                    </Text>
                </div>

                {/* Submit */}
                <Button
                    type="primary" size="large" block
                    icon={<ShoppingCartOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={cartItems.length === 0}
                >
                    {submitting ? 'Creating Invoice...' : 'Create Purchase Invoice'}
                </Button>
            </Card>

            {/* ── Invoice Modal ── */}
            <Modal
                title={null}
                open={invoiceModalOpen}
                onCancel={() => setInvoiceModalOpen(false)}
                width={680}
                footer={[
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>,
                    <Button key="close" type="primary" onClick={() => setInvoiceModalOpen(false)}>Close</Button>,
                ]}
            >
                {generatedInvoice && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 8 }} />
                            <Title level={3} style={{ margin: 0 }}>Purchase Invoice</Title>
                            <Text type="secondary">Vehicle Parts & Service Center</Text>
                        </div>

                        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Invoice No.">
                                <Text strong style={{ color: '#1677ff' }}>{generatedInvoice.invoiceNumber}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Date">{generatedInvoice.invoiceDate}</Descriptions.Item>
                            <Descriptions.Item label="Vendor" span={2}>
                                <Text strong>{generatedInvoice.vendorName}</Text>
                            </Descriptions.Item>
                        </Descriptions>

                        <Table
                            columns={invoiceColumns}
                            dataSource={generatedInvoice.items.map((item, i) => ({ ...item, key: i }))}
                            pagination={false}
                            size="small"
                        />

                        <div style={{
                            textAlign: 'right', marginTop: 16,
                            padding: '12px 16px', background: '#f0f7ff',
                            borderRadius: 8, border: '1px solid #bae0ff',
                        }}>
                            <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                                Total Paid to Vendor: {formatRupees(generatedInvoice.totalAmount)}
                            </Text>
                        </div>

                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                            <Tag color="success">Stock updated successfully</Tag>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                                Purchased from {generatedInvoice.vendorName} on {generatedInvoice.invoiceDate}
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}