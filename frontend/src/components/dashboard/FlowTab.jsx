import { useEffect, useMemo, useState } from "react";
import { ReactFlow, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, RotateCcw } from "lucide-react";

// zone: "client" = happens in the browser, "server" = happens on the cloud side
const FLOWS = {
  upload: [
    { title: "Your file", sub: "Picked in browser", zone: "client", note: "You choose a file. Nothing has left your device yet." },
    { title: "AES-256-GCM", sub: "Random key + IV", zone: "client", note: "The browser generates a fresh AES-256 key and encrypts the file with it." },
    { title: "RSA-OAEP", sub: "Wrap the AES key", zone: "client", note: "The AES key and file name are encrypted with your RSA public key." },
    { title: "Server API", sub: "JWT checked", zone: "server", note: "Only ciphertext and encrypted metadata are sent. The server verifies your JWT but never sees a key." },
    { title: "Storage", sub: "MongoDB + S3", zone: "server", note: "Ciphertext goes to local disk or a private S3 bucket. Metadata goes to MongoDB." },
  ],
  download: [
    { title: "Storage", sub: "MongoDB + S3", zone: "server", note: "Server finds the ciphertext that belongs to your account." },
    { title: "Server API", sub: "JWT checked", zone: "server", note: "Server sends back ciphertext and the wrapped key. It cannot open either." },
    { title: "RSA-OAEP", sub: "Unwrap with private key", zone: "client", note: "You unlock your private key with your password and recover the AES key." },
    { title: "AES-256-GCM", sub: "Decrypt + verify tag", zone: "client", note: "The browser decrypts the file and checks the GCM tag, so tampering is detected." },
    { title: "Your file", sub: "Saved to device", zone: "client", note: "The original file is rebuilt on your device." },
  ],
};

const COLORS = {
  client: { border: "#4ade80", glow: "rgba(74,222,128,0.35)", bg: "rgba(74,222,128,0.08)" },
  server: { border: "#fbbf24", glow: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.08)" },
};

export default function FlowTab() {
  const [mode, setMode] = useState("upload");
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const steps = FLOWS[mode];

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setActive((value) => {
        if (value >= steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [playing, steps.length]);

  const play = () => {
    setActive(0);
    setPlaying(true);
  };
  const reset = () => {
    setPlaying(false);
    setActive(-1);
  };
  const switchMode = (next) => {
    setMode(next);
    reset();
  };

  const nodes = useMemo(
    () =>
      steps.map((step, i) => {
        const color = COLORS[step.zone];
        const on = i <= active;
        return {
          id: String(i),
          position: { x: i * 230, y: 40 },
          draggable: false,
          data: {
            label: (
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{step.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{step.sub}</div>
              </div>
            ),
          },
          style: {
            width: 170,
            padding: 14,
            borderRadius: 16,
            color: "#fff",
            textAlign: "center",
            border: `1.5px solid ${on ? color.border : "rgba(255,255,255,0.15)"}`,
            background: on ? color.bg : "rgba(255,255,255,0.03)",
            boxShadow: i === active ? `0 0 28px ${color.glow}` : "none",
            opacity: active === -1 || on ? 1 : 0.55,
            transition: "all 0.4s ease",
          },
          sourcePosition: "right",
          targetPosition: "left",
        };
      }),
    [steps, active]
  );

  const edges = useMemo(
    () =>
      steps.slice(1).map((_, i) => ({
        id: `e${i}`,
        source: String(i),
        target: String(i + 1),
        animated: i < active,
        markerEnd: { type: MarkerType.ArrowClosed, color: i < active ? "#a78bfa" : "#475569" },
        style: { stroke: i < active ? "#a78bfa" : "#475569", strokeWidth: 2 },
      })),
    [steps, active]
  );

  return (
    <section className="glass fade-in rounded-2xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">How your file is protected</h3>
          <p className="mt-1 text-sm text-gray-400">Hybrid encryption: AES for the file, RSA for the key.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
            {["upload", "download"].map((id) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                className={`rounded-lg px-4 py-1.5 capitalize transition ${mode === id ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"}`}
              >
                {id}
              </button>
            ))}
          </div>
          <button onClick={play} className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium">
            <Play size={15} />
            Play
          </button>
          <button onClick={reset} title="Reset" className="rounded-xl border border-white/10 p-2.5 text-gray-400 hover:text-white">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-2"><i className="inline-block size-2.5 rounded-full bg-green-400" />Your browser (keys live here)</span>
        <span className="flex items-center gap-2"><i className="inline-block size-2.5 rounded-full bg-amber-400" />Server / cloud (ciphertext only)</span>
      </div>

      <div className="mt-2 h-64 w-full">
        <ReactFlow
          key={mode}
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          colorMode="dark"
        />
      </div>

      <div className="mt-2 min-h-16 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
        {active === -1 ? (
          <>Press <b className="text-white">Play</b> to watch the {mode} step by step.</>
        ) : (
          <>
            <b className="text-white">Step {active + 1}: {steps[active].title}.</b> {steps[active].note}
          </>
        )}
      </div>
    </section>
  );
}
