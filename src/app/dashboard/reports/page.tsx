"use client";

import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  Table,
  TextField,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface TransactionItemDto {
  type: string; // "Sale" | "Purchase"
  invoiceNumber: string;
  date: string;
  description: string;
  amount: number;
}

interface FinancialReportDto {
  reportType: string;
  period: string;
  totalRevenue: number;
  totalExpenditure: number;
  netProfit: number;
  transactions: TransactionItemDto[];
}

const MONTHS = [
  { id: "1", label: "January" },
  { id: "2", label: "February" },
  { id: "3", label: "March" },
  { id: "4", label: "April" },
  { id: "5", label: "May" },
  { id: "6", label: "June" },
  { id: "7", label: "July" },
  { id: "8", label: "August" },
  { id: "9", label: "September" },
  { id: "10", label: "October" },
  { id: "11", label: "November" },
  { id: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

function fmt(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

type ReportType = "Daily" | "Monthly" | "Yearly";

function buildQueryKey(
  reportType: ReportType,
  date: string,
  month: string,
  year: string,
  generation: number,
): [string, ReportType, string, string, string, number] {
  return ["financialReport", reportType, date, month, year, generation];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("Monthly");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(currentYear));
  const [generation, setGeneration] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "Financial Reports | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const queryKey = buildQueryKey(reportType, date, month, year, generation);

  const {
    data: report,
    isLoading,
    isError,
    error,
    isFetched,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (reportType === "Daily") {
        return apiFetchDirect<FinancialReportDto>(
          `/api/report/daily?date=${date}`,
        );
      }
      if (reportType === "Monthly") {
        return apiFetchDirect<FinancialReportDto>(
          `/api/report/monthly?month=${month}&year=${year}`,
        );
      }
      return apiFetchDirect<FinancialReportDto>(
        `/api/report/yearly?year=${year}`,
      );
    },
    enabled: generation > 0,
    staleTime: Number.POSITIVE_INFINITY,
  });

  function handleGenerate() {
    setValidationError(null);

    if (reportType === "Daily" && !date) {
      setValidationError("Please select a date.");
      return;
    }
    if ((reportType === "Monthly" || reportType === "Yearly") && !year) {
      setValidationError("Please select a year.");
      return;
    }
    if (reportType === "Monthly" && !month) {
      setValidationError("Please select a month.");
      return;
    }

    setGeneration((g) => g + 1);
  }

  const netProfitPositive = report ? report.netProfit >= 0 : true;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <h2 className="text-xl font-bold">Financial Reports</h2>

      {/* Parameters card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-base">Generate Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a report type and period, then click Generate.
          </p>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Report type */}
          <Select
            fullWidth
            value={reportType}
            onChange={(v) => {
              if (v) setReportType(v as ReportType);
            }}
          >
            <Label>Report Type</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {(["Daily", "Monthly", "Yearly"] as ReportType[]).map((t) => (
                  <ListBox.Item key={t} id={t} textValue={t}>
                    {t}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Period inputs */}
          <div className="grid grid-cols-2 gap-4">
            {reportType === "Daily" && (
              <TextField isRequired fullWidth value={date} onChange={setDate}>
                <Label>Date</Label>
                <Input type="date" />
                <FieldError />
              </TextField>
            )}

            {reportType === "Monthly" && (
              <>
                <Select
                  isRequired
                  fullWidth
                  value={month}
                  onChange={(v) => {
                    if (v) setMonth(v);
                  }}
                >
                  <Label>Month</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {MONTHS.map((m) => (
                        <ListBox.Item key={m.id} id={m.id} textValue={m.label}>
                          {m.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  isRequired
                  fullWidth
                  value={year}
                  onChange={(v) => {
                    if (v) setYear(v);
                  }}
                >
                  <Label>Year</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {YEARS.map((y) => (
                        <ListBox.Item key={y} id={y} textValue={y}>
                          {y}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </>
            )}

            {reportType === "Yearly" && (
              <Select
                isRequired
                fullWidth
                value={year}
                onChange={(v) => {
                  if (v) setYear(v);
                }}
              >
                <Label>Year</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {YEARS.map((y) => (
                      <ListBox.Item key={y} id={y} textValue={y}>
                        {y}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          </div>

          {validationError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {validationError}
            </p>
          )}

          <div className="flex justify-end">
            <Button onPress={handleGenerate} isPending={isLoading}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {isPending ? "Generating…" : "Generate Report"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          {(error as Error | null)?.message ?? "Failed to load report."}
        </p>
      )}

      {/* Results */}
      {isFetched && report && !isError && (
        <>
          {/* Period heading */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              {report.reportType} Report
            </p>
            <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
              {report.period}
            </h3>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Total Revenue
              </p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {fmt(report.totalRevenue)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Total Expenditure
              </p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {fmt(report.totalExpenditure)}
              </p>
            </div>
            <div
              className={`border rounded-lg p-5 shadow-sm ${
                netProfitPositive
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-xs uppercase tracking-wide font-medium mb-1 ${
                  netProfitPositive ? "text-green-600" : "text-red-500"
                }`}
              >
                Net Profit
              </p>
              <p
                className={`text-xl font-bold tabular-nums ${
                  netProfitPositive ? "text-green-700" : "text-red-700"
                }`}
              >
                {report.netProfit < 0 ? "-" : ""}
                {fmt(Math.abs(report.netProfit))}
              </p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-base">Transactions</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {report.transactions.length} transaction
                {report.transactions.length !== 1 ? "s" : ""} in this period
              </p>
            </div>

            {report.transactions.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">
                No transactions in this period.
              </p>
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Transactions">
                    <Table.Header>
                      <Table.Column isRowHeader>Invoice</Table.Column>
                      <Table.Column>Date</Table.Column>
                      <Table.Column>Type</Table.Column>
                      <Table.Column>Description</Table.Column>
                      <Table.Column>Amount</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {report.transactions.map((tx) => (
                        <Table.Row
                          key={`${tx.type}-${tx.invoiceNumber}`}
                          id={`${tx.type}-${tx.invoiceNumber}`}
                        >
                          <Table.Cell className="font-medium tabular-nums">
                            {tx.invoiceNumber}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums">
                            {tx.date}
                          </Table.Cell>
                          <Table.Cell>
                            <span
                              className={`text-xs px-2 py-0.5 rounded border font-medium ${
                                tx.type === "Sale"
                                  ? "border-blue-300 text-blue-700 bg-blue-50"
                                  : "border-orange-300 text-orange-700 bg-orange-50"
                              }`}
                            >
                              {tx.type}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-gray-600 text-sm">
                            {tx.description}
                          </Table.Cell>
                          <Table.Cell className="font-medium tabular-nums">
                            {fmt(tx.amount)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
