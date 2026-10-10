interface AppIconProps {
  size: number
}

// Mesmo desenho de public/favicon.svg (o teste AppIcon.test.tsx garante).
// Exceção às cores por token: o ícone é a marca e tem cores fixas.
export function AppIcon({ size }: AppIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="512" height="512" rx="112" fill="#1C3F3A" />
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M226 396 C230 424 270 424 268 392 L252 130 C248 92 292 84 296 120 C300 160 234 186 214 232 C190 290 210 352 264 358 C310 362 340 330 330 294 C320 258 268 254 252 282 C240 304 260 324 282 312"
      />
      <circle cx="224" cy="396" r="22" fill="#34D399" />
    </svg>
  )
}
