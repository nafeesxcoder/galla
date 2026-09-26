const paths = {
  // software
  receipt: "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4",
  doc: "M7 2h7l4 4v16H7zM14 2v5h4M10 12h6M10 16h4",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9",
  ledger: "M5 3h13a1 1 0 0 1 1 1v17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18M13 8h3M13 12h3",
  pos: "M4 4h16v6H4zM7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01M4 4v16h16V4",
  shield: "M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5zM9 12l2 2 4-4",
  // industries
  basket: "M4 9h16l-1.5 10.5A2 2 0 0 1 16.5 21h-9A2 2 0 0 1 5.5 19.5L4 9zM8 9 10 3M16 9 14 3",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M9 21h.01M17 21h.01",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
  gem: "M6 3h12l3 6-9 12L3 9zM3 9h18M9 3 6 9l6 12 6-12-3-6",
  shirt: "M8 3 4 6l2 3 2-1v12h8V8l2 1 2-3-4-3-2 2h-4z",
  plug: "M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0zM12 18v3",
  cup: "M4 7h13v6a6 6 0 0 1-12 0zM17 8h2a2 2 0 0 1 0 5h-2M3 21h16",
  tool: "M14.5 3a5 5 0 0 0-5 7.5L3 17v4h4l6.5-6.5A5 5 0 0 0 21 9.5L17.5 13 15 10.5 18.5 7A5 5 0 0 0 14.5 3z",
  phone: "M7 2h10v20H7zM11 18h2",
  scissor: "M6 4l12 12M18 4L6 16M7 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  factory: "M3 21V9l6 4V9l6 4V3h6v18zM7 17h2M13 17h2M19 17h.01",
  // company / get started
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9",
  handshake: "M7 11 3 7l4-4 3 3h4l3-3 4 4-4 4M7 11l3 3 2-2 2 2 3-3M7 11l-2 2 4 4 2-2",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01",
  download: "M12 3v12M8 11l4 4 4-4M4 19h16",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

export default function MenuIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.doc} />
    </svg>
  );
}
