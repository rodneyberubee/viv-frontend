import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Send, Zap, Sparkles, Bot, Clock3, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * DemoShowcasePage
 * ---------------------------------------------------------------
 * A single, public-facing page that mixes a chatbot input with a live
 * read-only dashboard table for the demo tenant `mollyscafe1`.
 *
 * ✅ No auth. Read-only dashboard view.
 * ✅ Uses your existing middleware endpoints.
 * ✅ Designed to be visually clean yet a little provocative to drive clicks.
 *
 * Endpoints assumed (adjust if yours differ):
 *  - POST  `${API_BASE}/api/askViv/mollyscafe1`  body: { userMessage: { messages: [...] } }
 *  - GET   `${API_BASE}/api/dashboard/reservations/mollyscafe1`
 *
 * To point this page at your middleware:
 *  - Set NEXT_PUBLIC_API_URL in your env (e.g., http://209.38.149.254:5000)
 *  - Or leave it empty to proxy via your own Next.js API routes.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""; // e.g. "http://209.38.149.254:5000"
const RESTAURANT_ID = "mollyscafe1";

// Types for safety (align with your middleware shape)
interface ReservationRow {
  confirmation?: string;
  name?: string;
  partySize?: number;
  contactInfo?: string;
  date?: string; // YYYY-MM-DD
  timeSlot?: string; // ISO or HH:mm depending on your router
  status?: string;
  createdAt?: string;
}

interface AskVivResult {
  type: string;
  restaurantId?: string;
  message?: string;
  error?: string;
  [k: string]: any;
}

const DemoShowcasePage: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(true);
  const [chatInput, setChatInput] = useState("I’d like a table for 2 tonight at 6pm under Molly. My number is 555-123-4567.");
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string; raw?: any }[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const reservationsUrl = useMemo(
    () => `${API_BASE}/api/dashboard/reservations/${RESTAURANT_ID}`,
    []
  );
  const askVivUrl = useMemo(
    () => `${API_BASE}/api/askViv/${RESTAURANT_ID}`,
    []
  );

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(reservationsUrl, { cache: "no-store" });
      if (!r.ok) throw new Error(`GET ${reservationsUrl} ${r.status}`);
      const data = await r.json();
      // Accept either an array or an object with a `rows` field
      const rows: ReservationRow[] = Array.isArray(data) ? data : (data.rows ?? []);
      setReservations(rows);
    } catch (e: any) {
      console.error("[Demo] fetchReservations error:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [reservationsUrl]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Light polling so the table looks alive without auth
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchReservations, 10000);
    return () => clearInterval(id);
  }, [polling, fetchReservations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setTranscript((t) => [...t, { role: "user", text: userText }]);
    setChatInput("");
    setSubmitting(true);
    try {
      const payload = {
        userMessage: {
          messages: [{ role: "user", content: userText }],
        },
      };
      const r = await fetch(askVivUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: AskVivResult = await r.json();

      // Make a friendly, minimal assistant line based on `type`
      let summary = result.message;
      if (!summary) {
        switch (result.type) {
          case "reservation.confirmation":
            summary = "Booked! Confirmation code is in the response.";
            break;
          case "reservation.unavailable":
            summary = "That time isn’t available. See suggestions in the response.";
            break;
          case "reservation.error":
            summary = result.error ? `Error: ${result.error}` : "We hit an error. Check the details.";
            break;
          default:
            summary = `Result: ${result.type}`;
        }
      }

      setTranscript((t) => [
        ...t,
        { role: "assistant", text: summary!, raw: result },
      ]);
      // Refresh table after a booking/cancel/change
      if (result.type && result.type.startsWith("reservation.")) {
        fetchReservations();
      }
    } catch (e: any) {
      console.error("[Demo] askViv error:", e?.message || e);
      setTranscript((t) => [
        ...t,
        { role: "assistant", text: "Network error talking to Viv." },
      ]);
    } finally {
      setSubmitting(false);
    }
  }, [askVivUrl, chatInput, fetchReservations]);

  const hero = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-orange-500 text-white p-8 shadow-xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-3"
      >
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
            <Clock3 className="h-4 w-4" /> 15‑minute slots
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm">
            <Users2 className="h-4 w-4" /> Party‑size logic
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="pointer-events-none absolute -right-6 -top-6 opacity-30"
      >
        <Zap className="h-24 w-24" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        {hero}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chat */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5" /> Chat with Viv
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-[520px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {transcript.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Try: <em>“Table for 2 tonight at 6pm under Alex, my email is alex@example.com.”</em>
                      </p>
                    )}
                    {transcript.map((m, i) => (
                      <div key={i} className={`max-w-[90%] ${m.role === "user" ? "ml-auto" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            m.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {m.text}
                        </div>
                        {m.role === "assistant" && m.raw && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-muted-foreground">view JSON</summary>
                            <pre className="mt-1 text-[11px] bg-muted/50 rounded p-2 overflow-auto">
{JSON.stringify(m.raw, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-3">
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tell Viv when, how many, and a name + contact."
                      className="min-h-[44px] h-[44px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={submitting} className="h-[44px] px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Demo tenant: {RESTAURANT_ID}</span>
                    {submitting && <span>Talking to Viv…</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Reservations */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Live Reservations</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReservations()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <div className="text-xs text-muted-foreground">
                  {polling ? (
                    <button onClick={() => setPolling(false)} className="underline">stop auto‑refresh</button>
                  ) : (
                    <button onClick={() => setPolling(true)} className="underline">start auto‑refresh</button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">When</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[80px]">Party</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confirmation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-sm text-muted-foreground">
                            No reservations yet. Book one in the chat →
                          </TableCell>
                        </TableRow>
                      )}
                      {reservations.map((r, i) => {
                        const when = r.timeSlot || (r.date ? `${r.date}` : "");
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{when}</TableCell>
                            <TableCell>{r.name || "—"}</TableCell>
                            <TableCell>{r.partySize ?? "—"}</TableCell>
                            <TableCell>{r.status || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{r.confirmation || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Read‑only demo view. Data shown here comes from a dedicated demo table.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoShowcasePage;
