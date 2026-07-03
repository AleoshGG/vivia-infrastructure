type StatColor = 'dark' | 'orange' | 'red' | 'green';

interface StatCardProps {
  value: string | number;
  label: string;
  sublabel: string;
  color: StatColor;
}

const colorStyles: Record<StatColor, { bar: string; value: string }> = {
  dark: { bar: 'bg-vivia-dark', value: 'text-vivia-dark' },
  orange: { bar: 'bg-[#ffa330]', value: 'text-[#ffa330]' },
  red: { bar: 'bg-[#ef4949]', value: 'text-[#ef4949]' },
  green: { bar: 'bg-[#26af72]', value: 'text-[#26af72]' },
};

export function StatCard({ value, label, sublabel, color }: StatCardProps) {
  const { bar, value: valueColor } = colorStyles[color];
  return (
    <div className="relative flex-1 bg-white rounded-[10px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05)] h-16 overflow-hidden">
      <div className={`absolute left-0 top-0 w-1 h-full rounded-l-[4px] ${bar}`} />
      <div className="flex items-baseline gap-3 pl-5 pt-2.5">
        <span className={`font-poppins font-semibold text-[22px] leading-none ${valueColor}`}>{value}</span>
        <div>
          <p className="font-poppins font-medium text-[11px] text-vivia-dark leading-none">{label}</p>
          <p className="font-poppins text-[10px] text-[#6f7e88] leading-none mt-1">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}
