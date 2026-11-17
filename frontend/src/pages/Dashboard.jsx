import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChartColumn, FileText, Folder, HardDrive, LockKeyhole, LogOut, Server, ShieldCheck, Unlock, Upload, Workflow } from "lucide-react";
import { decryptFile, decryptName, decryptPrivateKey, encryptFile, encryptName, importPublicKey } from "../utils/crypto";
import FilesTab from "../components/dashboard/FilesTab";
import ServerViewTab from "../components/dashboard/ServerViewTab";
import FlowTab from "../components/dashboard/FlowTab";
import StatsTab from "../components/dashboard/StatsTab";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const TABS = [
  { id: "files", label: "My Files", icon: Folder },
  { id: "server", label: "Server View", icon: Server },
  { id: "flow", label: "How it works", icon: Workflow },
  { id: "stats", label: "Stats", icon: ChartColumn },
];

const readSession = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const value = localStorage.getItem("user") || sessionStorage.getItem("user");
  try {
    return { token, user: value ? JSON.parse(value) : null };
  } catch {
    return { token, user: null };
  }
};

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

function StatCard({ icon, tone, label, value, hint }) {
  const Icon = icon;
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className={`mb-3 ${tone}`} size={24} />
      <p className="text-sm text-gray-400">{label}</p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { token, user } = readSession();
  const picker = useRef(null);
  const [tab, setTab] = useState("files");
  const [files, setFiles] = useState([]);
  const [timings, setTimings] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [privateKey, setPrivateKey] = useState(null);

  const api = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}/api/files${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Request failed. Check the server connection.");
      }
      return response;
    },
    [token]
  );

  const refresh = useCallback(async () => {
    const response = await api("/");
    const data = await response.json();
    const listed = await Promise.all(
      data.files.map(async (item) => {
        let name = "Encrypted file";
        if (privateKey) {
          try {
            name = await decryptName(item.encryptedName, privateKey);
          } catch {
            name = "Unable to decrypt filename";
          }
        }
        return { ...item, name, date: new Date(item.createdAt).toLocaleDateString() };
      })
    );
    setFiles(listed);
  }, [api, privateKey]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      refresh().catch((err) => {
        if (active) setError(err.message);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const unlock = async () => {
    if (privateKey) return privateKey;
    if (!user?.encryptedPrivateKey || !user?.salt || !user?.iv) {
      throw new Error("This account has no encryption key. Create a new account to use encrypted storage.");
    }
    const password = window.prompt("Enter your account password to unlock your encryption key:");
    if (password === null) throw new Error("Key unlock cancelled.");
    const key = await decryptPrivateKey(
      { encryptedPrivateKey: user.encryptedPrivateKey, salt: user.salt, iv: user.iv },
      password
    );
    setPrivateKey(key);
    return key;
  };

  const handleUnlock = async () => {
    setError("");
    try {
      await unlock();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (!user?.publicKey) throw new Error("No encryption public key is linked to this account.");
      const publicKey = await importPublicKey(user.publicKey);

      const t0 = performance.now();
      const encrypted = await encryptFile(file, publicKey);
      const encryptedName = await encryptName(file.name, publicKey);
      const encryptedMime = await encryptName(file.type || "application/octet-stream", publicKey);
      const t1 = performance.now();

      const body = new FormData();
      body.append("file", encrypted.encryptedBlob, "encrypted.bin");
      body.append("encryptedName", encryptedName);
      body.append("encryptedMime", encryptedMime);
      body.append("encryptedFileKey", encrypted.wrappedKey);
      body.append("iv", encrypted.iv);
      await api("/upload", { method: "POST", body });
      const t2 = performance.now();

      setTimings((list) => [...list, { name: file.name, encryptMs: Math.round(t1 - t0), uploadMs: Math.round(t2 - t1) }]);
      await refresh();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const handleDownload = async (file) => {
    setError("");
    setActiveId(file.id);
    try {
      const key = await unlock();
      const response = await api(`/${file.id}/content`);
      const encryptedBlob = await response.blob();
      const detail = await api(`/${file.id}/metadata`);
      const { encryptedFileKey: wrappedKey, encryptedMime } = (await detail.json()).file;
      const name = await decryptName(file.encryptedName, key);
      const mimeType = await decryptName(encryptedMime, key);
      const blob = await decryptFile(encryptedBlob, wrappedKey, key, mimeType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || "Could not decrypt this file.");
    } finally {
      setActiveId(null);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await api(`/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem("token");
      storage.removeItem("user");
    });
    navigate("/login", { replace: true });
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="bg-aurora min-h-screen text-white">
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#060a16]/70 px-6 py-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <div className="btn-primary rounded-xl p-2">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-xl font-bold">
            Secure<span className="text-gradient">Vault</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-400 sm:block">Welcome, {user?.name || "User"}</span>
          <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold">My Dashboard</h2>
            <p className="mt-2 text-gray-400">Files are encrypted in your browser before they reach the server.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUnlock}
              disabled={Boolean(privateKey)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                privateKey ? "border-green-400/30 bg-green-500/10 text-green-400" : "border-white/10 hover:bg-white/10"
              }`}
            >
              {privateKey ? <Unlock size={16} /> : <LockKeyhole size={16} />}
              {privateKey ? "Key unlocked" : "Unlock"}
            </button>
            <input ref={picker} type="file" onChange={handleUpload} className="hidden" />
            <button
              onClick={() => picker.current?.click()}
              disabled={busy}
              className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              <Upload size={16} />
              {busy ? "Encrypting & uploading…" : "Upload file"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <StatCard icon={FileText} tone="text-blue-400" label="Total files" value={files.length} />
          <StatCard icon={HardDrive} tone="text-purple-400" label="Encrypted storage" value={formatSize(totalSize)} />
          <StatCard icon={LockKeyhole} tone="text-green-400" label="Encryption" value="AES-256-GCM" hint="RSA-OAEP key wrapping" />
        </div>

        <div className="glass mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === id ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === "files" && (
          <FilesTab
            files={files}
            query={query}
            setQuery={setQuery}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onUploadClick={() => picker.current?.click()}
            activeId={activeId}
            formatSize={formatSize}
          />
        )}
        {tab === "server" && <ServerViewTab files={files} api={api} privateKey={privateKey} formatSize={formatSize} />}
        {tab === "flow" && <FlowTab />}
        {tab === "stats" && <StatsTab files={files} timings={timings} />}

        <p className="mt-8 text-center text-xs text-gray-500">
          The server stores only ciphertext and encrypted filenames. It never sees your keys.
        </p>
      </main>
    </div>
  );
}

export default Dashboard;
