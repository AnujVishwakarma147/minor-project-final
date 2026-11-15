import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, Download, File, FileText, HardDrive, Image, LockKeyhole, LogOut, Search, ShieldCheck, Trash2, Upload } from "lucide-react";
import { decryptFile, decryptName, decryptPrivateKey, encryptFile, encryptName, importPublicKey } from "../utils/crypto";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const readSession = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const value = localStorage.getItem("user") || sessionStorage.getItem("user");
  try { return { token, user: value ? JSON.parse(value) : null }; } catch { return { token, user: null }; }
};

function Dashboard() {
  const navigate = useNavigate();
  const { token, user } = readSession();
  const picker = useRef(null);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [privateKey, setPrivateKey] = useState(null);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/files${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || "Request failed. Check the server connection.");
    }
    return response;
  }, [token]);

  const refresh = useCallback(async () => {
    const response = await api("/");
    const data = await response.json();
    const listed = await Promise.all(data.files.map(async (item) => {
      let name = "Encrypted file";
      if (privateKey) {
        try { name = await decryptName(item.encryptedName, privateKey); } catch { name = "Unable to decrypt filename"; }
      }
      return { ...item, name, date: new Date(item.createdAt).toLocaleDateString() };
    }));
    setFiles(listed);
  }, [api, privateKey]);

  useEffect(() => { refresh().catch((err) => setError(err.message)); }, [refresh]);

  const unlock = async () => {
    if (privateKey) return privateKey;
    if (!user?.encryptedPrivateKey || !user?.salt || !user?.iv) {
      throw new Error("This account has no encryption key. Create a new account to use encrypted storage.");
    }
    const password = window.prompt("Enter your account password to unlock your encryption key:");
    if (password === null) throw new Error("Key unlock cancelled.");
    const key = await decryptPrivateKey({ encryptedPrivateKey: user.encryptedPrivateKey, salt: user.salt, iv: user.iv }, password);
    setPrivateKey(key);
    return key;
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (!user?.publicKey) throw new Error("No encryption public key is linked to this account.");
      const publicKey = await importPublicKey(user.publicKey);
      const encrypted = await encryptFile(file, publicKey);
      const encryptedName = await encryptName(file.name, publicKey);
      const encryptedMime = await encryptName(file.type || "application/octet-stream", publicKey);
      const body = new FormData();
      body.append("file", encrypted.encryptedBlob, "encrypted.bin");
      body.append("encryptedName", encryptedName);
      body.append("encryptedMime", encryptedMime);
      body.append("encryptedFileKey", encrypted.wrappedKey);
      body.append("iv", encrypted.iv);
      await api("/upload", { method: "POST", body });
      await refresh();
    } catch (err) { setError(err.message || "Upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  };

  const handleDownload = async (file) => {
    setError(""); setActiveId(file.id);
    try {
      const key = await unlock();
      const response = await api(`/${file.id}/content`);
      const encryptedBlob = await response.blob();
      const metadata = await api("/").then((r) => r.json());
      const encryptedMeta = metadata.files.find((item) => item.id === file.id);
      const detail = await fetch(`${API_URL}/api/files/${file.id}/metadata`, { headers: { Authorization: `Bearer ${token}` } });
      if (!detail.ok) throw new Error("File key metadata unavailable.");
      const { encryptedFileKey: wrappedKey, encryptedMime } = (await detail.json()).file;
      const name = encryptedMeta ? await decryptName(encryptedMeta.encryptedName, key) : "download";
      const mimeType = await decryptName(encryptedMime, key);
      const blob = await decryptFile(encryptedBlob, wrappedKey, key, mimeType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = name;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.message || "Could not decrypt this file."); }
    finally { setActiveId(null); }
  };

  const handleDelete = async (id) => {
    setError("");
    try { await api(`/${id}`, { method: "DELETE" }); await refresh(); }
    catch (err) { setError(err.message); }
  };

  const visibleFiles = useMemo(() => files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase())), [files, query]);
  const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  const logout = () => { [localStorage, sessionStorage].forEach((storage) => { storage.removeItem("token"); storage.removeItem("user"); }); navigate("/login", { replace: true }); };

  return <div className="min-h-screen bg-[#080d1a] text-white">
    <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-8"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-600 p-2"><ShieldCheck size={24} /></div><h1 className="text-xl font-bold">SecureVault</h1></div><div className="flex items-center gap-4"><span className="hidden text-sm text-gray-400 sm:block">Welcome, {user?.name || "User"}</span><button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 hover:bg-white/10"><LogOut size={17} />Logout</button></div></nav>
    <main className="mx-auto max-w-7xl px-6 py-10"><div className="mb-8"><h2 className="text-3xl font-bold">My Dashboard</h2><p className="mt-2 text-gray-400">Your files are encrypted in this browser before they reach the server.</p></div>
      <div className="mb-8 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6"><FileText className="mb-4 text-blue-400" size={25} /><p className="text-gray-400">Total Files</p><h3 className="mt-2 text-3xl font-bold">{files.length}</h3></div><div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6"><HardDrive className="mb-4 text-purple-400" size={25} /><p className="text-gray-400">Encrypted storage</p><h3 className="mt-2 text-3xl font-bold">{formatSize(files.reduce((sum, file) => sum + file.size, 0))}</h3></div><div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6"><LockKeyhole className="mb-4 text-green-400" size={25} /><p className="text-gray-400">Encryption</p><h3 className="mt-2 text-xl font-bold">AES-256-GCM</h3><p className="mt-2 text-xs text-gray-500">RSA-OAEP key wrapping</p></div></div>
      <div className="mb-8 rounded-2xl border border-dashed border-blue-500/50 bg-blue-500/5 p-10 text-center"><Cloud className="mx-auto mb-4 text-blue-400" size={40} /><h3 className="text-xl font-semibold">Upload Your Files</h3><p className="mt-2 text-sm text-gray-400">AES-GCM encrypts file contents; RSA-OAEP protects file keys and names.</p><input ref={picker} type="file" onChange={handleUpload} className="hidden" /><button onClick={() => picker.current?.click()} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"><Upload size={18} />{busy ? "Encrypting and uploading…" : "Choose a file"}</button>{error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}</div>
      <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-6"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="text-xl font-semibold">My Files</h3><p className="mt-1 text-sm text-gray-400">Only your account can access these encrypted files.</p></div><div className="flex items-center gap-3"><button onClick={async () => { try { setError(""); await unlock(); await refresh(); } catch (err) { setError(err.message); } }} className="text-sm text-blue-400 hover:text-blue-300">Unlock filenames</button><div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2"><Search size={18} className="text-gray-400" /><input aria-label="Search files" placeholder="Search files..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none sm:w-48" /></div></div></div><div className="space-y-3">{visibleFiles.map((file) => <div key={file.id} className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">{file.name.match(/\.(png|jpe?g|gif|webp)$/i) ? <Image size={22} /> : file.name.endsWith(".pdf") ? <FileText size={22} /> : <File size={22} />}</div><div><p className="font-medium">{file.name}</p><p className="mt-1 text-xs text-gray-500">{formatSize(file.size)} · {file.date}</p></div></div><div className="flex items-center gap-3"><span className="flex items-center gap-1 text-xs text-green-400"><LockKeyhole size={14} />Encrypted</span><button onClick={() => handleDownload(file)} disabled={activeId === file.id} title="Decrypt and download" className="rounded-lg p-2 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400"><Download size={18} /></button><button onClick={() => handleDelete(file.id)} title="Delete file" className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={18} /></button></div></div>)}{!visibleFiles.length && <p className="py-8 text-center text-gray-400">{files.length ? "No matching files." : "No files yet. Upload one to get started."}</p>}</div></section>
      <p className="mt-6 text-center text-xs text-gray-500">Files are encrypted in your browser. The server stores ciphertext and encrypted filenames.</p>
    </main>
  </div>;
}

export default Dashboard;
