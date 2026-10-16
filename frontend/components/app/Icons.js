// ===========================================================================
// ICONS
// ---------------------------------------------------------------------------
// Drawn in code, not loaded as files. A shop on a slow connection should not
// wait on an icon font before the billing screen is usable, and an inline
// path costs nothing and takes the surrounding text colour for free.
//
// Every icon is 24x24, 1.6 stroke, round caps. Keep new ones to that grid
// or they will look wrong next to the rest.
// ===========================================================================

function Svg({ children, size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />
  </Svg>
);

export const IconBill = (p) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconBox = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 14.8c2.1.6 3.5 2.4 3.5 5.2" />
  </Svg>
);

export const IconList = (p) => (
  <Svg {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4.5 4.5" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconChevron = (p) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 13 4.5 4.5L19 7" />
  </Svg>
);

export const IconPrint = (p) => (
  <Svg {...p}>
    <path d="M7 9V3h10v6" />
    <path d="M5 9h14a1 1 0 0 1 1 1v6h-4v5H8v-5H4v-6a1 1 0 0 1 1-1z" />
    <path d="M8 16h8" />
  </Svg>
);

export const IconShare = (p) => (
  <Svg {...p}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 16V3M8 7l4-4 4 4" />
  </Svg>
);

export const IconWhatsApp = (p) => (
  <Svg {...p}>
    <path d="M20 11.7A8 8 0 0 1 8.2 19L4 20l1.1-4.1A8 8 0 1 1 20 11.7z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.3-.7-1 .8a5 5 0 0 1-2.3-2.3l.8-1L11 9.5c0-.5-.4-1-1-1-.5 0-1 .4-1 1z" />
  </Svg>
);

export const IconRupee = (p) => (
  <Svg {...p}>
    <path d="M7 4h10M7 9h10M15.5 4c0 4-2.5 5-6 5l7 10" />
  </Svg>
);

export const IconWarn = (p) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="m14 6 4 4" />
  </Svg>
);

export const IconShop = (p) => (
  <Svg {...p}>
    <path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M3 9l2-5h14l2 5" />
    <path d="M9 21v-6h6v6" />
  </Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M4.2 7.5l2.2 1.3M17.6 15.2l2.2 1.3M4.2 16.5l2.2-1.3M17.6 8.8l2.2-1.3" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
    <path d="M15 8l4 4-4 4M9 12h10" />
  </Svg>
);

export const IconArrowDown = (p) => (
  <Svg {...p}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </Svg>
);

export const IconArrowUp = (p) => (
  <Svg {...p}>
    <path d="M12 20V5M6 11l6-6 6 6" />
  </Svg>
);

export const IconHistory = (p) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 8v4.5l3 1.8" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M7 3h4l1.5 4L10 8.5a9 9 0 0 0 5.5 5.5L17 12l4 1.5V18a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3z" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </Svg>
);

export const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M12 3v12M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconLock = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <path d="M12 14v2.5" />
  </Svg>
);

export const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M3 7.5V7a1.5 1.5 0 0 1 1.5-1.5H16" />
    <path d="M20 11h-3.2a1.8 1.8 0 0 0 0 3.6H20" />
  </Svg>
);

export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 20v-6M12.5 20V8M17 20v-9" />
  </Svg>
);

export const IconKeyboard = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6.5" width="19" height="11" rx="1.5" />
    <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10" />
  </Svg>
);
