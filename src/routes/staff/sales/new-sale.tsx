import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
    Card, Table, Button, Select, InputNumber,
    Typography, Space, Tag, Divider, Switch, Modal,
    message, Empty, Statistic, Alert,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, ShoppingCartOutlined,
    CheckCircleOutlined, GiftOutlined, UserOutlined,
    FileTextOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Part {
    id: number;
    partName: string;
    partCode: string;
    sellingPrice: number;
    stockQuantity: number;
    vendorId: number;
}

interface Customer {
    id: number;
    fullName: string;
    email: string;
}

interface CartItem {
    partId: number;
    partName: string;
    partCode: string;
    unitSellingPrice: number;
    quantity: number;
    stock: number;
}

interface SalesInvoiceResponseDto {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    customerEmail: string;
    staffName: string;
    subtotal: number;
    loyaltyDiscount: number | null;
    finalTotal: number;
    paymentStatus: string;
    paymentDueDate: string | null;
    loyaltyDiscountApplied: boolean;
    items: {
        partName: string;
        partNumber: string;
        quantity: number;
        unitSellingPrice: number;
        totalPrice: number;
    }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5154/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
        });
    } catch (e) {
        throw new Error(`Network error — is the backend running? (${String(e)})`);
    }
    const text = await res.text();
    if (!text) {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return undefined as T;
    }
    let json: { success?: boolean; message?: string; data?: T } | null = null;
    try { json = JSON.parse(text); } catch {
        throw new Error(`Non-JSON response: ${text}`);
    }
    if (!res.ok || json?.success === false)
        throw new Error(json?.message || `Server error ${res.status}`);
    return json?.data as T;
}

async function apiGetParts(): Promise<Part[]> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/Part`, {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        throw new Error(`Network error — is the backend running? (${String(e)})`);
    }
    if (!res.ok) throw new Error(`Failed to load parts — server error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data ?? []);
}

async function apiGetCustomers(): Promise<Customer[]> {
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/staff-customers`, {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        throw new Error(`Network error — is the backend running? (${String(e)})`);
    }
    if (!res.ok) throw new Error(`Failed to load customers — server error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data ?? []);
}

async function apiCreateSalesInvoice(payload: {
    customerId: number;
    createdByStaffId: number;
    isCredit: boolean;
    items: { partId: number; quantity: number }[];
}): Promise<SalesInvoiceResponseDto> {
    return apiFetch<SalesInvoiceResponseDto>('/SalesInvoice', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/staff/sales/new-sale')({
    component: NewSalePage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount: number) => `Rs. ${amount.toLocaleString()}`;

// ─── Component ────────────────────────────────────────────────────────────────

function NewSalePage() {
    const [parts, setParts]         = useState<Part[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const [cart, setCart]                     = useState<CartItem[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
    const [selectedQty, setSelectedQty]       = useState<number>(1);

    const [customerId, setCustomerId] = useState<number | null>(null);
    const [isCredit, setIsCredit]     = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [receiptOpen, setReceiptOpen] = useState(false);
    const [invoice, setInvoice]         = useState<SalesInvoiceResponseDto | null>(null);

    // TODO: replace with real auth context
    const STAFF_ID = 3;

    // ── Load data ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoadingData(true);
            try {
                const [p, c] = await Promise.all([apiGetParts(), apiGetCustomers()]);
                setParts(p);
                setCustomers(c);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to load data';
                message.error(msg, 6);
            } finally {
                setLoadingData(false);
            }
        };
        load();
    }, []);

    // ── Cart logic ─────────────────────────────────────────────────────────────
    const selectedPart = parts.find(p => p.id === selectedPartId);

    const addToCart = () => {
        if (!selectedPart) return message.warning('Please select a part');
        if (selectedQty < 1) return message.warning('Quantity must be at least 1');
        if (selectedQty > selectedPart.stockQuantity)
            return message.error(`Only ${selectedPart.stockQuantity} in stock`);

        setCart(prev => {
            const existing = prev.find(i => i.partId === selectedPart.id);
            if (existing) {
                const newQty = existing.quantity + selectedQty;
                if (newQty > selectedPart.stockQuantity) {
                    message.error(`Only ${selectedPart.stockQuantity} in stock`);
                    return prev;
                }
                return prev.map(i =>
                    i.partId === selectedPart.id ? { ...i, quantity: newQty } : i,
                );
            }
            return [...prev, {
                partId:           selectedPart.id,
                partName:         selectedPart.partName,
                partCode:         selectedPart.partCode,
                unitSellingPrice: selectedPart.sellingPrice,
                quantity:         selectedQty,
                stock:            selectedPart.stockQuantity,
            }];
        });

        setSelectedPartId(null);
        setSelectedQty(1);
        message.success(`${selectedPart.partName} added to cart`);
    };

    const removeFromCart = (partId: number) =>
        setCart(prev => prev.filter(i => i.partId !== partId));

    const updateQty = (partId: number, qty: number) => {
        const item = cart.find(i => i.partId === partId);
        if (!item) return;
        if (qty > item.stock) return message.error(`Only ${item.stock} in stock`);
        if (qty < 1) return removeFromCart(partId);
        setCart(prev => prev.map(i => i.partId === partId ? { ...i, quantity: qty } : i));
    };

    // ── Totals ─────────────────────────────────────────────────────────────────
    const subtotal        = cart.reduce((s, i) => s + i.unitSellingPrice * i.quantity, 0);
    const loyaltyEligible = subtotal > 5000;
    const discount        = loyaltyEligible ? Math.floor(subtotal * 0.1) : 0;
    const finalTotal      = subtotal - discount;

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!customerId) return message.error('Please select a customer');
        if (cart.length === 0) return message.error('Cart is empty');

        setSubmitting(true);
        try {
            const result = await apiCreateSalesInvoice({
                customerId,
                createdByStaffId: STAFF_ID,
                isCredit,
                items: cart.map(i => ({ partId: i.partId, quantity: i.quantity })),
            });
            setInvoice(result);
            setReceiptOpen(true);
            // reset state — no form.resetFields() needed anymore
            setCart([]);
            setCustomerId(null);
            setIsCredit(false);
            setSelectedPartId(null);
            setSelectedQty(1);
            message.success(`Invoice ${result.invoiceNumber} created!`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create invoice';
            message.error(msg, 8);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Cart columns ───────────────────────────────────────────────────────────
    const cartColumns = [
        {
            title: 'Part',
            dataIndex: 'partName',
            render: (name: string, r: CartItem) => (
                <div>
                    <Text strong>{name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.partCode}</Text>
                </div>
            ),
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitSellingPrice',
            width: 110,
            render: (v: number) => fmt(v),
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            width: 120,
            render: (qty: number, r: CartItem) => (
                <InputNumber
                    min={1}
                    max={r.stock}
                    value={qty}
                    onChange={v => updateQty(r.partId, v ?? 1)}
                    size="small"
                />
            ),
        },
        {
            title: 'Total',
            width: 110,
            render: (_: unknown, r: CartItem) => (
                <Text strong>{fmt(r.unitSellingPrice * r.quantity)}</Text>
            ),
        },
        {
            title: '',
            width: 50,
            render: (_: unknown, r: CartItem) => (
                <Button
                    danger type="text" size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(r.partId)}
                />
            ),
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div style={{ margin: 24, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

                {/* ── LEFT: Part selector + Cart ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    <Card title={<Space><ShoppingCartOutlined />Add Parts</Space>}>
                        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                            <Select
                                style={{ flex: 1 }}
                                placeholder="Search and select a part..."
                                showSearch
                                loading={loadingData}
                                value={selectedPartId}
                                onChange={v => { setSelectedPartId(v); setSelectedQty(1); }}
                                optionFilterProp="label"
                                options={parts.map(p => ({
                                    value: p.id,
                                    label: `${p.partName} (${p.partCode})`,
                                    disabled: p.stockQuantity === 0,
                                }))}
                                notFoundContent={<Empty description="No parts found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            />
                            <InputNumber
                                min={1}
                                max={selectedPart?.stockQuantity ?? 99}
                                value={selectedQty}
                                onChange={v => setSelectedQty(v ?? 1)}
                                style={{ width: 80 }}
                                placeholder="Qty"
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={addToCart}
                                disabled={!selectedPartId}
                            >
                                Add
                            </Button>
                        </Space.Compact>

                        {selectedPart && (
                            <div style={{
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: 8,
                                padding: '8px 12px',
                                display: 'flex',
                                gap: 24,
                            }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Price</Text>
                                    <div><Text strong>{fmt(selectedPart.sellingPrice)}</Text></div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>In Stock</Text>
                                    <div>
                                        <Tag color={selectedPart.stockQuantity < 10 ? 'red' : 'green'}>
                                            {selectedPart.stockQuantity} units
                                        </Tag>
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Line Total</Text>
                                    <div>
                                        <Text strong style={{ color: '#1677ff' }}>
                                            {fmt(selectedPart.sellingPrice * selectedQty)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card title={
                        <Space>
                            <ShoppingCartOutlined />Cart
                            {cart.length > 0 && <Tag color="blue">{cart.length} items</Tag>}
                        </Space>
                    }>
                        <Table
                            columns={cartColumns}
                            dataSource={cart}
                            rowKey="partId"
                            pagination={false}
                            size="small"
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No items added yet — search for a part above"
                                    />
                                ),
                            }}
                        />
                    </Card>
                </div>

                {/* ── RIGHT: Customer + Order Summary ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── Customer selector — plain div, NO Form wrapper ── */}
                    <Card title={<Space><UserOutlined />Customer</Space>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text type="secondary" style={{ fontSize: 14 }}>Select Customer</Text>
                            <Select
                                placeholder="Choose customer..."
                                showSearch
                                loading={loadingData}
                                value={customerId}
                                onChange={setCustomerId}
                                optionFilterProp="label"
                                style={{ width: '100%' }}
                                options={customers.map(c => ({
                                    value: c.id,
                                    label: c.fullName,
                                }))}
                                notFoundContent={
                                    <Empty
                                        description="No customers found"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                }
                            />
                        </div>
                    </Card>

                    <Card title={<Space><FileTextOutlined />Order Summary</Space>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Subtotal</Text>
                                <Text>{fmt(subtotal)}</Text>
                            </div>

                            {loyaltyEligible ? (
                                <div style={{
                                    background: '#f6ffed',
                                    border: '1px solid #b7eb8f',
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Space>
                                            <GiftOutlined style={{ color: '#52c41a' }} />
                                            <Text style={{ color: '#389e0d' }}>Loyalty Discount (10%)</Text>
                                        </Space>
                                        <Text style={{ color: '#389e0d' }}>- {fmt(discount)}</Text>
                                    </div>
                                </div>
                            ) : subtotal > 0 ? (
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Add ${fmt(5001 - subtotal)} more for 10% loyalty discount!`}
                                    style={{ padding: '4px 12px' }}
                                />
                            ) : null}

                            <Divider style={{ margin: '4px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: 16 }}>Total</Text>
                                <Statistic
                                    value={finalTotal}
                                    formatter={v => fmt(Number(v))}
                                    valueStyle={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}
                                />
                            </div>

                            <Divider style={{ margin: '4px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text strong>Credit Sale</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Payment due in 30 days
                                    </Text>
                                </div>
                                <Switch
                                    checked={isCredit}
                                    onChange={setIsCredit}
                                    checkedChildren="Credit"
                                    unCheckedChildren="Cash"
                                />
                            </div>

                            {isCredit && (
                                <Tag color="orange" style={{ textAlign: 'center' }}>
                                    Payment due in 30 days
                                </Tag>
                            )}

                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<CheckCircleOutlined />}
                                loading={submitting}
                                disabled={cart.length === 0 || !customerId}
                                onClick={handleSubmit}
                                style={{ marginTop: 8 }}
                            >
                                Create Invoice
                            </Button>

                            {(!customerId || cart.length === 0) && (
                                <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                                    {!customerId && '• Select a customer'}
                                    {!customerId && cart.length === 0 && <br />}
                                    {cart.length === 0 && '• Add at least one part'}
                                </Text>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ── Receipt Modal ── */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        Invoice Created Successfully
                    </Space>
                }
                open={receiptOpen}
                onCancel={() => setReceiptOpen(false)}
                footer={
                    <Button type="primary" onClick={() => setReceiptOpen(false)}>
                        Done
                    </Button>
                }
                width={560}
            >
                {invoice && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{
                            background: '#f8faff',
                            border: '1px solid #e0e7ff',
                            borderRadius: 8,
                            padding: '12px 16px',
                            marginBottom: 16,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                        }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Invoice #</Text>
                                <div><Text strong>{invoice.invoiceNumber}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Date</Text>
                                <div><Text>{String(invoice.invoiceDate)}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Customer</Text>
                                <div><Text strong>{invoice.customerName}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Staff</Text>
                                <div><Text>{invoice.staffName}</Text></div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Payment</Text>
                                <div>
                                    <Tag color={invoice.paymentStatus === 'Paid' ? 'green' : 'orange'}>
                                        {invoice.paymentStatus}
                                    </Tag>
                                </div>
                            </div>
                            {invoice.paymentDueDate && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Due Date</Text>
                                    <div>
                                        <Text>{new Date(invoice.paymentDueDate).toLocaleDateString()}</Text>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Table
                            size="small"
                            pagination={false}
                            dataSource={invoice.items}
                            rowKey="partName"
                            columns={[
                                {
                                    title: 'Part',
                                    dataIndex: 'partName',
                                    render: (v: string, r: typeof invoice.items[0]) => (
                                        <>
                                            <Text strong>{v}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 11 }}>{r.partNumber}</Text>
                                        </>
                                    ),
                                },
                                { title: 'Qty',   dataIndex: 'quantity',         width: 50 },
                                { title: 'Unit',  dataIndex: 'unitSellingPrice', width: 90,  render: (v: number) => fmt(v) },
                                { title: 'Total', dataIndex: 'totalPrice',       width: 100, render: (v: number) => <Text strong>{fmt(v)}</Text> },
                            ]}
                        />

                        <Divider />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Subtotal</Text>
                                <Text>{fmt(invoice.subtotal)}</Text>
                            </div>
                            {invoice.loyaltyDiscountApplied && invoice.loyaltyDiscount && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Space>
                                        <GiftOutlined style={{ color: '#52c41a' }} />
                                        <Text style={{ color: '#389e0d' }}>Loyalty Discount (10%)</Text>
                                    </Space>
                                    <Text style={{ color: '#389e0d' }}>- {fmt(invoice.loyaltyDiscount)}</Text>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong style={{ fontSize: 15 }}>Total</Text>
                                <Text strong style={{ fontSize: 15, color: '#1677ff' }}>{fmt(invoice.finalTotal)}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}