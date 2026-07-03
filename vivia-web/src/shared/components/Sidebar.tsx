import { useNavigate } from 'react-router-dom';

export type NavItem = 'dashboard' | 'users' | 'reports' | 'identity' | 'settings';

interface NavItemConfig {
  id: NavItem;
  label: string;
  path?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Panel de Control' },
  { id: 'users', label: 'Usuarios' },
  { id: 'reports', label: 'Reportes', path: '/reports' },
  { id: 'identity', label: 'Verificación de Identidad', path: '/identity' },
  { id: 'settings', label: 'Configuración' },
];

interface SidebarProps {
  activeItem: NavItem;
  onNavigate?: (item: NavItem) => void;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
}

export function Sidebar({ activeItem, onNavigate, onLogout, userName = 'Admin', userRole = 'Administrador' }: SidebarProps) {
  const navigate = useNavigate();
  const initial = userName.charAt(0).toUpperCase();

  const handleNavigate = (item: NavItemConfig) => {
    onNavigate?.(item.id);
    if (item.path) navigate(item.path);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-vivia-dark overflow-hidden flex flex-col z-10">
      <div className="h-1 bg-[#00d2be] shrink-0" />

      <div className="flex items-center gap-3 px-5 py-4 shrink-0">
        <div className="size-10 rounded-full bg-vivia-mid flex items-center justify-center shrink-0">
          <span className="text-white font-poppins font-semibold text-sm">V</span>
        </div>
        <div>
          <p className="font-poppins font-semibold text-[22px] text-white leading-none">Vivia</p>
          <p className="font-poppins text-[10px] text-[#00d2be] leading-none mt-0.5">Admin Panel</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/15 shrink-0" />

      <nav className="flex flex-col gap-0.5 px-[10px] py-[10px] flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeItem;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item)}
              className={`relative flex items-center h-[44px] w-full rounded-[8px] px-[36px] text-left transition-colors cursor-pointer ${
                isActive ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-[8px] w-[3px] h-[28px] bg-[#00d2be] rounded-[2px]" />
              )}
              <span
                className={`font-poppins text-[13px] leading-none ${
                  isActive ? 'font-medium text-white' : 'font-normal text-white/65'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mx-5 h-px bg-white/15 shrink-0" />

      <div className="flex items-center gap-3 px-5 py-4 shrink-0">
        <div className="size-9 rounded-full bg-vivia-mid flex items-center justify-center shrink-0">
          <span className="font-poppins font-semibold text-[14px] text-white">{initial}</span>
        </div>
        <div>
          <p className="font-poppins font-medium text-[12px] text-white leading-none">{userName}</p>
          <p className="font-poppins text-[10px] text-white/55 leading-none mt-1">{userRole}</p>
        </div>
      </div>

      {onLogout && (
        <button
          onClick={onLogout}
          className="flex items-center gap-2 mx-3 mb-3 h-[40px] rounded-[8px] px-[13px] text-left text-white/65 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="font-poppins text-[13px] leading-none">Cerrar Sesión</span>
        </button>
      )}
    </aside>
  );
}
