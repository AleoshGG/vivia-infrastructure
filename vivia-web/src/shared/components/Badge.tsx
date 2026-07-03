type BadgeColor = 'red' | 'orange' | 'blue' | 'green' | 'gray';
type BadgeShape = 'pill' | 'tag';

interface BadgeProps {
  label: string;
  color: BadgeColor;
  shape?: BadgeShape;
}

const colorStyles: Record<BadgeColor, string> = {
  red: 'bg-[rgba(239,73,73,0.12)] text-[#ef4949]',
  orange: 'bg-[rgba(255,163,48,0.12)] text-[#ffa330]',
  blue: 'bg-[rgba(30,100,230,0.12)] text-[#1e64e6]',
  green: 'bg-[rgba(38,175,114,0.12)] text-[#26af72]',
  gray: 'bg-[#f0f6f7] text-[#6f7e88]',
};

export function Badge({ label, color, shape = 'pill' }: BadgeProps) {
  const radius = shape === 'pill' ? 'rounded-full' : 'rounded-[4px]';
  return (
    <span
      className={`inline-flex items-center justify-center px-3 h-6 text-[10px] font-poppins font-medium ${radius} ${colorStyles[color]}`}
    >
      {label}
    </span>
  );
}
