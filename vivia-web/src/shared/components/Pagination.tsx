interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, itemLabel = 'reportes' }: PaginationProps) {
  const showing = Math.min(pageSize * currentPage, totalItems);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between py-4 px-6">
      <p className="text-[12px] font-poppins text-[#6f7e88]">
        Mostrando {showing} de {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`size-8 rounded-[6px] text-[12px] font-medium font-poppins text-center transition-colors cursor-pointer ${
              page === currentPage
                ? 'bg-vivia-dark text-white'
                : 'bg-[#f0f6f7] text-[#6f7e88] hover:bg-[#e6eaed]'
            }`}
          >
            {page}
          </button>
        ))}
        {totalPages > 5 && (
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="size-8 rounded-[6px] text-[14px] font-medium font-poppins text-center bg-[#f0f6f7] text-[#6f7e88] hover:bg-[#e6eaed] transition-colors cursor-pointer"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
