// Remove: import { motion } from "framer-motion";
const hero = (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-orange-500 text-white p-8 shadow-xl">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <span className="text-sm/5 tracking-wide uppercase">Live Demo • No Login</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
        Watch <span className="underline decoration-white/70">Viv</span> take bookings in real time.
      </h1>
      <p className="text-white/90 max-w-2xl">
        Type a request. See it land in the table. This is a real AI reservationist wired to a demo database for <b>Molly’s Café</b>.
      </p>
      <div className="pt-1 flex flex-wrap gap-3 text-white/90">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm">
          <Bot className="h-4 w-4" /> AI Concierge
        </div>
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm">
          <Clock3 className="h-4 w-4" /> 15-minute slots
        </div>
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm">
          <Users2 className="h-4 w-4" /> Party-size logic
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute -right-6 -top-6 opacity-30">
      <Zap className="h-24 w-24" />
    </div>
  </div>
);
