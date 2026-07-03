import type { ReportPriority } from '../../domain/objectvalues/ReportPriority';

export type PriorityFilter = ReportPriority | null;

interface FilterBarProps {
  activePriority: PriorityFilter;
  searchQuery: string;
  onPriorityChange: (priority: PriorityFilter) => void;
  onSearchChange: (query: string) => void;
}

const PRIORITY_OPTIONS: {
  id: ReportPriority;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    id: 'HIGH',
    label: 'Alta',
    activeClass: 'bg-[rgba(239,73,73,0.2)] text-[#ef4949]',
    inactiveClass: 'bg-[rgba(239,73,73,0.12)] text-[#ef4949]',
  },
  {
    id: 'MEDIUM',
    label: 'Media',
    activeClass: 'bg-[rgba(255,163,48,0.2)] text-[#ffa330]',
    inactiveClass: 'bg-[rgba(255,163,48,0.12)] text-[#ffa330]',
  },
  {
    id: 'LOW',
    label: 'Baja',
    activeClass: 'bg-[rgba(30,100,230,0.2)] text-[#1e64e6]',
    inactiveClass: 'bg-[rgba(30,100,230,0.12)] text-[#1e64e6]',
  },
];

export function FilterBar({
  activePriority,
  searchQuery,
  onPriorityChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="h-12 bg-white shadow-[0px_1px_4px_0px_rgba(0,0,0,0.04)] flex items-center gap-3 px-5">
      <span className="font-poppins font-medium text-[11px] text-[#6f7e88] shrink-0">PRIORIDAD:</span>

      <div className="flex items-center gap-1">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onPriorityChange(activePriority === opt.id ? null : opt.id)}
            className={`h-7 px-3 rounded-full text-[11px] font-medium font-poppins transition-colors cursor-pointer ring-1 ring-inset ${
              activePriority === opt.id
                ? `${opt.activeClass} ring-current`
                : `${opt.inactiveClass} ring-transparent`
            }`}
          >
            {opt.label}
          </button>
        ))}

        {activePriority !== null && (
          <button
            onClick={() => onPriorityChange(null)}
            className="h-7 px-3 rounded-full text-[11px] font-medium font-poppins transition-colors cursor-pointer bg-[#f0f6f7] text-[#6f7e88] hover:bg-[#e6eaed] flex items-center gap-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Borrar
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div className="h-[30px] w-[220px] bg-[#f0f6f7] border border-[#e6eaed] rounded-[6px] flex items-center px-2 gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6f7e88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título, arrendador..."
          className="flex-1 bg-transparent font-poppins text-[11px] text-[#04364a] placeholder:text-[#6f7e88] outline-none"
        />
      </div>


    </div>
  );
}
