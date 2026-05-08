"use client";

import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import Calendar from "react-calendar";
import Skeleton from "react-loading-skeleton";

type AttendanceRecord = {
  id: string;
  user_id: string;
  date: string;
  attempted_email: string;
  created_at: string;
};

const columnHelper = createColumnHelper<AttendanceRecord>();

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminAttendanceTable() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // get table data
        const response = await fetch("/api/admin/attendance", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          attendance: AttendanceRecord[];
        };

        setData(payload.attendance ?? []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setData([]);
      }
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  // filters
  const selectedDateKey = useMemo(
    () => toDateKey(selectedDate),
    [selectedDate],
  );

  const filteredData = useMemo(
    () => data.filter((record) => record.date === selectedDateKey),
    [data, selectedDateKey],
  );

  const signedInDays = useMemo(
    () => new Set(data.map((record) => record.date)),
    [data],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("attempted_email", {
        header: "Student Email",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("created_at", {
        header: "Timestamp",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return <Skeleton count={1} width={512} height={559} />;
  }

  return (
    <div className="w-full mt-8 overflow-hidden border border-gray-200 rounded-lg">
      <h2 className="px-4 py-3 text-lg font-bold border-b border-gray-200 bg-gray-50 text-ink">
        Attendance Records
      </h2>
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <Calendar
          className="attendance-calendar"
          value={selectedDate}
          onChange={(value) => {
            if (value instanceof Date) {
              setSelectedDate(value);
            }
          }}
          tileClassName={({ date, view }) => {
            if (view !== "month") return undefined;
            return signedInDays.has(toDateKey(date))
              ? "attendance-signed"
              : undefined;
          }}
        />
        <p className="mt-3 text-sm text-ink-muted">
          Showing records for {selectedDateKey}
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 font-medium cursor-pointer select-none hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                          ? " ↓"
                          : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-4 text-center">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
