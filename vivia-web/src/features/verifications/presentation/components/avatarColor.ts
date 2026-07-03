const AVATAR_COLORS = ['#ef4949', '#1e64e6', '#9333ea', '#ffa330', '#26af72'];

export function avatarColorFor(id: string): string {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
