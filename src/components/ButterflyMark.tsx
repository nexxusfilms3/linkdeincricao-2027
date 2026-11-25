interface ButterflyMarkProps {
  className?: string;
}

export function ButterflyMark({ className = 'w-8 h-8' }: ButterflyMarkProps) {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left wing: solid plum silhouette matching Eliete Oliveira visual identity */}
      <path
        d="M38 24C34 12 20 3 9 7C2 10 3 23 13 30C21 35 31 33 38 30V24Z"
        fill="#5B236E"
      />
      <path
        d="M38 31C30 33 17 36 14 45C12 52 20 56 27 52C33 48 37 39 38 33V31Z"
        fill="#5B236E"
      />
      {/* Right wing: delicate line-art botanical filigree */}
      <path
        d="M42 24C46 12 60 3 71 7C78 10 77 23 67 30C59 35 49 33 42 30V24Z"
        stroke="#5B236E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 31C50 33 63 36 66 45C68 52 60 56 53 52C47 48 43 39 42 33V31Z"
        stroke="#5B236E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46 21C53 16 62 15 68 18M45 27C54 25 62 26 66 29M45 36C51 39 58 43 60 48"
        stroke="#733586"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Body and antennae */}
      <ellipse cx="40" cy="31" rx="2.3" ry="12" fill="#4A1A5B" />
      <path
        d="M39 19C37 13 34 10 31 9M41 19C43 13 46 10 49 9"
        stroke="#4A1A5B"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GoldFlourishDivider({ className = 'w-64 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 15C74 7 128 19 160 12C192 5 246 17 312 9"
        stroke="#D6B575"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M153 12C155.5 7 160 5 160 5C160 5 164.5 7 167 12C164.5 17 160 19 160 19C160 19 155.5 17 153 12Z"
        fill="#D6B575"
      />
    </svg>
  );
}
