import React, { useEffect, useState, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const RESTAURANT_ID = "mollyscafe1";

export default function SocialMediaPage() {
  const [reservations, setReservations] = useState([]);
  const [chatInput, setChatInput] = useState(
    "I’d like a table for 2 tonight at 6pm under Molly. My number is 555-123-4567."
  );
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const chatEndRef = useRef(null);

  const fetchReservations = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/dashboard/reservations/${RESTAURANT_ID}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : data.rows ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    fetchReservations();
    const poll = setInterval(fetchReservations, 10000);
    return () => clearInterval(poll);
  }, []);

  // Listen for broadcasted reservation updates
  useEffect(() => {
    const bc = new BroadcastChannel("reservations");
    bc.onmessage = (e) => {
      if (e.data.type === "reservationUpdate") {
        fetchReservations();
      }
    };
    return () => bc.close();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setTranscript((t) => [...t, { role: "user", text: msg }]);
    setChatInput("");
    setSubmitting(true);

    try {
      // Use real payload shape
      const payload = {
        messages: [{ role: "user", content: msg }],
      };

      const res = await fetch(`${API_BASE}/api/askViv/${RESTAURANT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      // Trigger speech output
      try {
        const speakRes = await fetch(`/api/speakViv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const speakData = await speakRes.json();
        const spokenResponse = speakData.spokenResponse;
        setTranscript((t) => [
          ...t,
          { role: "assistant", text: spokenResponse || data.message || JSON.stringify(data) },
        ]);
      } catch (speechErr) {
        console.error("[Demo] speakViv error:", speechErr);
        setTranscript((t) => [
          ...t,
          { role: "assistant", text: data.message || JSON.stringify(data) },
        ]);
      }

      // Refresh table if it's a booking/cancel/change
      if (data.type && data.type.startsWith("reservation.")) {
        fetchReservations();
        const bc = new BroadcastChannel("reservations");
        bc.postMessage({ type: "reservationUpdate", timestamp: Date.now() });
        bc.close();
      }
    } catch (err) {
      console.error(err);
      setTranscript((t) => [
        ...t,
        { role: "assistant", text: "Network error talking to Viv." },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-pink-600 text-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold">Viv Live Demo</h1>
          <p>
            Type a request. See it land in the table. This is a real AI
            reservationist wired to a demo database for <b>Molly’s Café</b>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat */}
          <div className="bg-white rounded-lg shadow flex flex-col h-[500px]">
            <div className="flex-1 p-4 overflow-auto">
              {transcript.length === 0 && (
                <p className="text-sm text-gray-500">
                  Try: <em>“Table for 2 tonight at 6pm under Alex”</em>
                </p>
              )}
              {transcript.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 ${
                    m.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded ${
                      m.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-3 flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 border rounded p-2 text-sm"
                placeholder="Tell Viv when, how many, and a name + contact."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={submitting}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </div>

          {/* Reservations */}
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Live Reservations</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">When</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Party</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-gray-500">
                      No reservations yet.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 border">
                        {r.timeSlot || r.date || "—"}
                      </td>
                      <td className="p-2 border">{r.name || "—"}</td>
                      <td className="p-2 border">{r.partySize || "—"}</td>
                      <td className="p-2 border">{r.status || "—"}</td>
                      <td className="p-2 border">{r.confirmation || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              Data shown here comes from a dedicated demo table.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
