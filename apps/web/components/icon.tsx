export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    leaf: <><path d="M19 4C9 3 3 8 6 16c8 3 13-3 13-12Z"/><path d="m5 20 9-10"/></>,
    home: <><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></>,
    record: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    pill: <><path d="m9 4-5 5a6 6 0 0 0 8 8l5-5a6 6 0 0 0-8-8Z"/><path d="m7 7 8 8"/></>,
    heart: <path d="M12 20 3 11C-1 4 8 1 12 7c4-6 13-3 9 4Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
    alert: <><path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3v1"/></>,
    chat: <path d="M4 4h16v12H9l-5 4Z"/>,
    flower: <><path d="M12 12C1 4 14-3 12 12c8-11 15 2 0 0 11 8-2 15 0 0-8 11-15-2 0 0Z"/><circle cx="12" cy="12" r="2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.record}</svg>;
}
