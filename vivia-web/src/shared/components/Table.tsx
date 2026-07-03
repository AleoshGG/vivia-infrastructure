import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
}

export function Table<T>({ columns, data, keyExtractor }: TableProps<T>) {
  return (
    <div className="bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] overflow-hidden w-full">
      <table className="w-full border-collapse">
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-[#f0f3f5] border-b border-[#e6eaed]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="h-10 px-4 text-left text-[10px] font-medium font-poppins text-[#6f7e88] tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={keyExtractor(row, i)}
              className="border-b border-[#e6eaed] bg-white"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-4 align-middle">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
