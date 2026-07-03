import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';

type ReviewTab = Extract<VerificationStatus, 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'>;

interface VerificationTabsProps {
  activeTab: ReviewTab;
  counts: Partial<Record<ReviewTab, number>>;
  searchQuery: string;
  onTabChange: (tab: ReviewTab) => void;
  onSearchChange: (query: string) => void;
}

const TABS: { id: ReviewTab; label: string }[] = [
  { id: 'PENDING_REVIEW', label: 'Por revisar' },
  { id: 'VERIFIED', label: 'Aceptados' },
  { id: 'REJECTED', label: 'Rechazados' },
];

export function VerificationTabs({ activeTab, counts, searchQuery, onTabChange, onSearchChange }: VerificationTabsProps) {
  return (
    <div className="bg-white shadow-[0px_1px_4px_0px_rgba(0,0,0,0.04)] flex items-center justify-between px-8 h-14 border-b-2 border-[#e6eaed]">
      <div className="flex items-center gap-10 h-full">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-start justify-center h-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-poppins text-[13px] leading-none ${
                    isActive ? 'font-semibold text-[#00d2be]' : 'font-normal text-[#6f7e88]'
                  }`}
                >
                  {tab.label}
                </span>
                {count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center h-[18px] px-2 rounded-full text-[10px] font-medium font-poppins ${
                      isActive ? 'bg-[rgba(0,210,190,0.15)] text-[#00d2be]' : 'bg-[rgba(111,126,136,0.12)] text-[#6f7e88]'
                    }`}
                  >
                    {count.toLocaleString('es-MX')}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-[#00d2be]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-[#f0f6f7] border border-[#e6eaed] rounded-lg h-[34px] w-[260px] flex items-center px-3">
        <span className="font-poppins text-[12px] text-[#6f7e88] mr-1">🔍</span>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar usuario..."
          className="bg-transparent flex-1 font-poppins text-[12px] text-vivia-dark placeholder:text-[#6f7e88] outline-none"
        />
      </div>
    </div>
  );
}

export type { ReviewTab };
