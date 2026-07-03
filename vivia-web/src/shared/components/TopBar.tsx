interface TopBarProps {
  title: string;
  breadcrumb?: string;
  userInitial?: string;
}

export function TopBar({ title, breadcrumb, userInitial = 'A' }: TopBarProps) {
  return (
    <header className="h-16 bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] flex items-center justify-between px-8">
      <div>
        <h1 className="font-poppins font-semibold text-[18px] text-vivia-dark leading-none">{title}</h1>
        {breadcrumb && (
          <p className="font-poppins text-[11px] text-[#6f7e88] leading-none mt-1.5">{breadcrumb}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="size-5 flex items-center justify-center text-[#6f7e88] hover:text-vivia-dark transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#00d2be]" />
        </div>
        <div className="size-9 rounded-full bg-vivia-dark flex items-center justify-center">
          <span className="font-poppins font-semibold text-[14px] text-white">{userInitial}</span>
        </div>
      </div>
    </header>
  );
}
