import { useEffect, useState } from "react";
import { Eye, Lock, Server } from "lucide-react";
import { decryptName } from "../../utils/crypto";

// AES-GCM adds a 12-byte IV in front and a 16-byte tag at the end.
const GCM_OVERHEAD = 12 + 16;
const IV_BYTES = 12;

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
const shorten = (text, max = 56) => (text && text.length > max ? `${text.slice(0, max)}…` : text || "—");
const isReadable = (name) => name !== "Encrypted file" && name !== "Unable to decrypt filename";

function Row({ label, value, mono }) {
  return (
    <div className="border-b border-white/5 py-3 last:border-0">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 break-all text-sm ${mono ? "font-mono-code text-amber-200/90" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default function ServerViewTab({ files, api, privateKey, formatSize }) {
  const [selectedId, setSelectedId] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [mimeResult, setMimeResult] = useState(null);

  const current = files.find((file) => file.id === selectedId) || files[0];
  const currentId = current?.id;

  // What the server really holds for this file
  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const meta = (await (await api(`/${currentId}/metadata`)).json()).file;
        const blob = await (await api(`/${currentId}/content`)).blob();
        const head = new Uint8Array(await blob.slice(0, 48).arrayBuffer());
        if (!cancelled) setLoaded({ id: currentId, wrappedKey: meta.encryptedFileKey, encryptedMime: meta.encryptedMime, head });
      } catch (err) {
        if (!cancelled) setLoaded({ id: currentId, error: err.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, api]);

  // Ignore data that belongs to a previously selected file
  const server = loaded?.id === currentId ? loaded : null;

  // What only the owner can read (needs the unlocked private key)
  const encryptedMime = server?.encryptedMime;
  useEffect(() => {
    if (!privateKey || !encryptedMime) return undefined;
    let cancelled = false;
    decryptName(encryptedMime, privateKey)
      .then((value) => !cancelled && setMimeResult({ source: encryptedMime, value }))
      .catch(() => !cancelled && setMimeResult({ source: encryptedMime, value: "unknown" }));
    return () => {
      cancelled = true;
    };
  }, [privateKey, encryptedMime]);
    const mime = mimeResult && mimeResult.source === encryptedMime ? mimeResult.value : null;

  if (!current) {
    return (
      <section className="glass fade-in rounded-2xl p-10 text-center text-gray-400">
        Upload a file first, then come here to compare what you see with what the server stores.
      </section>
    );
  }

  const unlocked = Boolean(privateKey) && isReadable(current.name);
  const hex = server?.head ? toHex(server.head) : [];

  return (
    <section className="fade-in space-y-6">
      <div className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Server View</h3>
          <p className="mt-1 text-sm text-gray-400">Same file, two points of view. This is the zero-knowledge proof.</p>
        </div>
        <select
          value={currentId}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="Choose file"
          className="rounded-xl border border-white/10 bg-[#0d1426] px-3 py-2 text-sm outline-none"
        >
          {files.map((file, index) => (
            <option key={file.id} value={file.id}>
              {isReadable(file.name) ? file.name : `File #${files.length - index} (locked)`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* YOU */}
        <div className="glass rounded-2xl border-green-400/20 p-6">
          <div className="mb-3 flex items-center gap-2 text-green-400">
            <Eye size={20} />
            <h4 className="font-semibold">What you see (in your browser)</h4>
          </div>
          {unlocked ? (
            <>
              <Row label="File name" value={current.name} />
              <Row label="File type" value={mime || "decrypting…"} />
              <Row label="Original size" value={formatSize(Math.max(current.size - GCM_OVERHEAD, 0))} />
              <Row label="Uploaded" value={current.date} />
            </>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-gray-400">
              <Lock size={32} className="mb-3 text-gray-500" />
              <p className="text-sm">Your key is locked. Click <b className="text-white">Unlock</b> at the top to read names.</p>
            </div>
          )}
        </div>

        {/* SERVER */}
        <div className="glass rounded-2xl border-amber-400/20 p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-400">
            <Server size={20} />
            <h4 className="font-semibold">What the server stores</h4>
          </div>
          <Row label="Encrypted file name" value={shorten(current.encryptedName)} mono />
          <Row label="Encrypted file type" value={server?.error ? server.error : shorten(server?.encryptedMime)} mono />
          <Row label="Wrapped AES key (RSA-OAEP)" value={shorten(server?.wrappedKey)} mono />
          <Row label="Stored size" value={`${formatSize(current.size)} (ciphertext + IV + tag)`} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h4 className="font-semibold">First 48 bytes of the stored .enc file</h4>
        <p className="mt-1 text-sm text-gray-400">
          <span className="text-amber-300">Amber = IV</span> (12 bytes), the rest is random-looking ciphertext. No readable content.
        </p>
        <div className="font-mono-code mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm leading-7">
          {hex.length ? (
            [0, 16, 32].map((start) => (
              <div key={start} className="whitespace-nowrap">
                <span className="mr-4 text-gray-600">{start.toString(16).padStart(4, "0")}</span>
                {hex.slice(start, start + 16).map((byte, i) => (
                  <span key={start + i} className={`mr-2 ${start + i < IV_BYTES ? "text-amber-300" : "text-sky-300/80"}`}>
                    {byte}
                  </span>
                ))}
              </div>
            ))
          ) : (
            <span className="text-gray-500">{server?.error || "Loading from server…"}</span>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Even with full access to the database and storage bucket, an attacker only gets this. The AES key is wrapped with your
          RSA public key, and only your private key (protected by your password) can unwrap it.
        </p>
      </div>
    </section>
  );
}
