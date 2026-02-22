import Image from "next/image";

function TerminalCard() {
  return (
    <div className="flow-card group relative w-[220px] md:w-[260px]">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl shadow-black/30 transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-card-hover">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
          </div>
          <span className="ml-1 text-[11px] text-muted font-mono">agent</span>
        </div>
        <div className="relative p-4 space-y-2.5">
          {/* Fake code lines — green bars of varying widths */}
          <div className="h-2.5 w-[85%] rounded-full bg-[#22C55E]/30" />
          <div className="h-2.5 w-[60%] rounded-full bg-[#22C55E]/20" />
          <div className="h-2.5 w-[92%] rounded-full bg-[#22C55E]/35" />
          <div className="h-2.5 w-[45%] rounded-full bg-[#22C55E]/15" />
          <div className="h-2.5 w-[75%] rounded-full bg-[#22C55E]/25" />

          {/* Green checkmark overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E]/60 flex items-center justify-center backdrop-blur-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted mt-3 tracking-wide">AI Agent</p>
    </div>
  );
}

function SentinelCard() {
  return (
    <div className="flow-card group">
      <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-2xl border border-accent/30 bg-card flex items-center justify-center shadow-xl shadow-black/30 shadow-[0_0_30px_rgba(245,158,11,0.08)] transition-transform duration-300 hover:scale-[1.05]">
        <Image
          src="/sentinel_logo.png"
          alt="Sentinel"
          width={40}
          height={40}
          className="opacity-90"
        />
      </div>
      <p className="text-center text-[11px] font-semibold text-accent mt-3 tracking-[0.15em] uppercase">Sentinel</p>
    </div>
  );
}

function UsdcCard() {
  return (
    <div className="flow-card group">
      <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-2xl border border-border bg-card flex items-center justify-center shadow-xl shadow-black/30 transition-transform duration-300 hover:scale-[1.05]">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" stroke="#2775CA" strokeWidth="2" fill="#2775CA" fillOpacity="0.12" />
          <text x="20" y="26" textAnchor="middle" fontSize="20" fontWeight="700" fill="#2775CA" fontFamily="Inter, sans-serif">$</text>
        </svg>
      </div>
      <p className="text-center text-[11px] font-semibold text-[#2775CA] mt-3 tracking-[0.15em] uppercase">x402</p>
    </div>
  );
}

function EndpointCard() {
  return (
    <div className="flow-card group w-[200px] md:w-[230px]">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl shadow-black/30 transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-card-hover">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22C55E]/20 text-[#22C55E] tracking-wide">GET</span>
          <span className="text-[11px] text-foreground font-mono">/api/data</span>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] text-muted mb-1.5 font-medium tracking-wide">Request:</p>
            <div className="space-y-1.5">
              <div className="h-2 w-[90%] rounded-full bg-[#3B82F6]/25" />
              <div className="h-2 w-[65%] rounded-full bg-[#3B82F6]/15" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted mb-1.5 font-medium tracking-wide">Response:</p>
            <div className="space-y-1.5">
              <div className="h-2 w-[95%] rounded-full bg-[#22C55E]/25" />
              <div className="h-2 w-[80%] rounded-full bg-[#22C55E]/20" />
              <div className="h-2 w-[55%] rounded-full bg-[#22C55E]/15" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted mt-3 tracking-wide">Endpoint</p>
    </div>
  );
}

function DashedConnector() {
  return (
    <div className="hidden md:flex items-center self-start mt-10 w-16 lg:w-24 relative">
      <div className="w-full border-t-2 border-dashed border-[#333]" />
      {/* Animated traveling dots */}
      <div className="absolute inset-0 flex items-center">
        <div className="flow-dot w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E80] absolute" style={{ animationDelay: "0s" }} />
        <div className="flow-dot w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E80] absolute" style={{ animationDelay: "0.8s" }} />
      </div>
    </div>
  );
}

function MobileConnector() {
  return (
    <div className="flex md:hidden items-center justify-center h-10 relative">
      <div className="h-full border-l-2 border-dashed border-[#333]" />
      <div className="flow-dot-vertical w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E80] absolute" />
    </div>
  );
}

export function FlowDiagram() {
  return (
    <div>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start justify-center gap-0">
        <TerminalCard />
        <DashedConnector />
        <SentinelCard />
        <DashedConnector />
        <UsdcCard />
        <DashedConnector />
        <EndpointCard />
      </div>

      {/* Mobile: vertical */}
      <div className="flex md:hidden flex-col items-center">
        <TerminalCard />
        <MobileConnector />
        <SentinelCard />
        <MobileConnector />
        <UsdcCard />
        <MobileConnector />
        <EndpointCard />
      </div>
    </div>
  );
}
