import React from 'react'

// Ilustrações oficiais do Design System (Traço 2px #141414, cortadas pela borda inferior)
export function IllustrationFocusRoom({ className = 'absolute left-0 bottom-0 w-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 20 200 130"
      className={className}
      fill="none"
      stroke="#141414"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M28 104 32 88H50L54 104"></path>
      <path d="M41 88C30 70 30 58 40 50M41 88C52 72 56 60 50 48M41 88C38 74 42 64 46 62"></path>
      <rect x="70" y="44" width="84" height="54" rx="4" fill="#f4f4f2"></rect>
      <rect x="76" y="50" width="72" height="40" rx="2"></rect>
      <path d="M84 60H120M84 68H134M92 76H116M108 98V104M98 104H118"></path>
      <rect x="162" y="88" width="14" height="16" rx="2"></rect>
      <path d="M176 92c5 0 5 8 0 8M167 82c-3-4 3-6 0-10"></path>
      <path d="M10 104H210M10 112H210M24 112V152M190 112V152"></path>
      <path d="M62 152C62 132 66 122 82 120H128C144 122 148 132 148 152" fill="#f4f4f2"></path>
      <path d="M76 134H134"></path>
    </svg>
  )
}

export function IllustrationAiAgents({ className = 'absolute left-0 bottom-0 w-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 10 200 140"
      className={className}
      fill="none"
      stroke="#141414"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M30 40v14M23 47h14M44 24v8M40 28h8"></path>
      <path d="M104 56V40"></path>
      <circle cx="104" cy="35" r="5" fill="#141414"></circle>
      <rect x="50" y="78" width="10" height="24" rx="4"></rect>
      <rect x="148" y="78" width="10" height="24" rx="4"></rect>
      <rect x="60" y="56" width="88" height="70" rx="18" fill="#0066FF"></rect>
      <rect x="72" y="72" width="64" height="30" rx="15" fill="#141414"></rect>
      <circle cx="92" cy="87" r="5" fill="#0066FF" stroke="none"></circle>
      <circle cx="116" cy="87" r="5" fill="#0066FF" stroke="none"></circle>
      <path d="M96 112c5 4 11 4 16 0"></path>
      <path d="M52 152C56 138 68 132 84 132H124C140 132 152 138 156 152" fill="#0066FF"></path>
      <path d="M104 132V152M90 140h28"></path>
      <rect x="140" y="14" width="54" height="30" rx="10" fill="#f4f4f2"></rect>
      <path d="M150 44 146 54 160 44"></path>
      <circle cx="156" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
      <circle cx="167" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
      <circle cx="178" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
    </svg>
  )
}

export function IllustrationTeamLounge({ className = 'absolute left-0 bottom-0 w-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 20 200 130"
      className={className}
      fill="none"
      stroke="#141414"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="70" y="24" width="60" height="36" rx="2"></rect>
      <path d="M76 54 92 38 104 50 112 44 124 54"></path>
      <circle cx="114" cy="34" r="3"></circle>
      <path d="M190 152V44M178 44 184 24H198L204 44Z" fill="#f4f4f2"></path>
      <path d="M34 152V94C34 84 40 80 50 80H150C160 80 166 84 166 94V152" fill="#f4f4f2"></path>
      <path d="M100 82V112M42 112H158"></path>
      <rect x="22" y="100" width="24" height="52" rx="9" fill="#f4f4f2"></rect>
      <rect x="154" y="100" width="24" height="52" rx="9" fill="#f4f4f2"></rect>
      <path d="M46 130H154"></path>
      <rect x="60" y="88" width="30" height="20" rx="6" fill="#0066FF"></rect>
    </svg>
  )
}

export function IllustrationNpcMascot({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 104 92"
      className={className}
      fill="none"
      stroke="#141414"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M52 22V11"></path>
      <circle cx="52" cy="8" r="4" fill="#0066FF"></circle>
      <rect x="9" y="40" width="9" height="20" rx="3" fill="#0066FF"></rect>
      <rect x="86" y="40" width="9" height="20" rx="3" fill="#0066FF"></rect>
      <rect x="18" y="22" width="68" height="56" rx="16" fill="#fff"></rect>
      <rect x="28" y="36" width="48" height="24" rx="12" fill="#141414"></rect>
      <circle cx="42" cy="48" r="4" fill="#0066FF" stroke="none"></circle>
      <circle cx="62" cy="48" r="4" fill="#0066FF" stroke="none"></circle>
      <path d="M46 68c4 3 8 3 12 0"></path>
      <path d="M90 58c0 14-8 22-22 22" strokeWidth="1.8"></path>
      <circle cx="66" cy="80" r="3" fill="#141414"></circle>
    </svg>
  )
}

export function IconRobot16({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2.5" y="5" width="11" height="8.5" rx="2.5"></rect>
      <path d="M8 5V2.5"></path>
      <circle cx="8" cy="2" r=".8" fill="currentColor"></circle>
      <circle cx="6" cy="9" r=".9" fill="currentColor"></circle>
      <circle cx="10" cy="9" r=".9" fill="currentColor"></circle>
    </svg>
  )
}

export function IconArrowUpRight10() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 8 8 2M3.5 2H8v4.5"></path>
    </svg>
  )
}

