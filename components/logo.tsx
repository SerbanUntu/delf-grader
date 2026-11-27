/**
 * The DELF Grader logo: a curry yellow "D" underlined in red, cropped to its drawing.
 *
 * @param className Classes for the SVG element, usually its size.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="31 25 67 99"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M59.8182 99H35.0682V29.1818H60.0227C67.0455 29.1818 73.0909 30.5795 78.1591 33.375C83.2273 36.1477 87.125 40.1364 89.8523 45.3409C92.6023 50.5455 93.9773 56.7727 93.9773 64.0227C93.9773 71.2955 92.6023 77.5455 89.8523 82.7727C87.125 88 83.2045 92.0114 78.0909 94.8068C73 97.6023 66.9091 99 59.8182 99ZM49.8295 86.3523H59.2045C63.5682 86.3523 67.2386 85.5795 70.2159 84.0341C73.2159 82.4659 75.4659 80.0455 76.9659 76.7727C78.4886 73.4773 79.25 69.2273 79.25 64.0227C79.25 58.8636 78.4886 54.6477 76.9659 51.375C75.4659 48.1023 73.2273 45.6932 70.25 44.1477C67.2727 42.6023 63.6023 41.8295 59.2386 41.8295H49.8295V86.3523Z"
        fill="#B88F14"
      />
      <rect x="35" y="108" width="40" height="12" fill="#B82F14" />
    </svg>
  );
}
