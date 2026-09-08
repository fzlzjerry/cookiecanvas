import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h13.5A2.5 2.5 0 0 1 20 9v8.5H5.5A2.5 2.5 0 0 1 3 15V7a3 3 0 0 1 3-3h10" />
      <path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z" />
      <path d="M16 13h.01" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 4h5v5" />
      <path d="m10 14 10-10" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M6.1 9A7 7 0 0 1 18.5 6.5L20 11" />
      <path d="M17.9 15A7 7 0 0 1 5.5 17.5L4 13" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function LoaderIcon(props: IconProps) {
  return (
    <svg {...base} {...props} className={`spin ${props.className ?? ""}`}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}
