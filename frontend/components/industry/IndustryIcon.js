const paths = {
  basket:
    "M4 9h16l-1.5 10.5A2 2 0 0 1 16.5 21h-9A2 2 0 0 1 5.5 19.5L4 9zM8 9 10 3M16 9 14 3",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M9 21h.01M17 21h.01",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
  gem: "M6 3h12l3 6-9 12L3 9zM3 9h18M9 3 6 9l6 12 6-12-3-6",
  shirt: "M8 3 4 6l2 3 2-1v12h8V8l2 1 2-3-4-3-2 2h-4z",
  plug: "M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0zM12 18v3",
  cup: "M4 7h13v6a6 6 0 0 1-12 0zM17 8h2a2 2 0 0 1 0 5h-2M3 21h16",
  tool: "M14.5 3a5 5 0 0 0-5 7.5L3 17v4h4l6.5-6.5A5 5 0 0 0 21 9.5L17.5 13 15 10.5 18.5 7A5 5 0 0 0 14.5 3z",
  phone: "M7 2h10v20H7zM11 18h2",
  scissor:
    "M6 4l12 12M18 4L6 16M7 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  truck:
    "M3 6h11v10H3zM14 9h4l3 3v4h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  factory: "M3 21V9l6 4V9l6 4V3h6v18zM7 17h2M13 17h2M19 17h.01",
};

export default function IndustryIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.basket} />
    </svg>
  );
}
