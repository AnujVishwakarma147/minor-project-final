
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  LockKeyhole,
  Cloud,
  Upload,
  FileText,
  Image,
  File,
  Search,
  LogOut,
  HardDrive,
  Trash2,
  Download,
} from "lucide-react";

import {
  generateRSAKeyPair,
  encryptFile,
  decryptFile,
} from "../utils/crypto";

function Dashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  let currentUser = null;
  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    currentUser = null;
  }
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Project_Report.pdf",
      size: "2.4 MB",
      bytes: 2.4 * 1024 * 1024,
      date: "Nov 10, 2026",
      type: "pdf",
      isEncrypted: false,
    },
    {
      id: 2,
      name: "Profile_Image.png",
      size: "1.2 MB",
      bytes: 1.2 * 1024 * 1024,
      date: "Nov 09, 2026",
      type: "image",
      isEncrypted: false,
    },
    {
      id: 3,
      name: "Important_Documents.docx",
      size: "850 KB",
      bytes: 850 * 1024,
      date: "Nov 07, 2026",
      type: "doc",
      isEncrypted: false,
    },
  ]);

  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  const [rsaKeys, setRsaKeys] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);

  // Encrypted files stored in browser memory
  const [encryptedFiles, setEncryptedFiles] = useState([]);

  // Generate RSA key pair when Dashboard loads
  useEffect(() => {
    let active = true;

    async function initializeKeys() {
      try {
        const keys = await generateRSAKeyPair();

        if (active) {
          setRsaKeys(keys);
        }
      } catch (err) {
        console.error("RSA key generation failed:", err);
        if (active) {
          setError("Unable to initialize encryption keys.");
        }
      } finally {
        if (active) {
          setKeyLoading(false);
        }
      }
    }

    initializeKeys();

    return () => {
      active = false;
    };
  }, []);

  // Format file size
  const formatStorage = (bytes) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Calculate total storage
  const totalStorage = files.reduce(
    (total, file) => total + file.bytes,
    0
  );

  // Search files
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Upload and encrypt file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!rsaKeys) {
      setError("Encryption keys are not ready yet.");
      event.target.value = "";
      return;
    }

    setError("");

    try {
      setUploading(true);

      // AES encryption + RSA key wrapping
      const result = await encryptFile(
        file,
        rsaKeys.publicKey
      );

      const fileId = Date.now() + Math.random();

      // Store encrypted data and wrapped AES key
      setEncryptedFiles((previousFiles) => [
        ...previousFiles,
        {
          id: fileId,
          encryptedBlob: result.encryptedBlob,
          wrappedKey: result.wrappedKey,
        },
      ]);

      // Add file details
      setFiles((previousFiles) => [
        ...previousFiles,
        {
          id: fileId,
          name: file.name,
          size: formatStorage(file.size),
          bytes: file.size,
          date: new Date().toLocaleDateString(),
          type: file.type.startsWith("image/")
            ? "image"
            : file.type === "application/pdf"
            ? "pdf"
            : "doc",
          mimeType: file.type || "application/octet-stream",
          isEncrypted: true,
        },
      ]);

      alert("File encrypted and AES key protected successfully!");

    } catch (err) {
      console.error("Encryption error:", err);
      setError("File encryption failed. Please try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Decrypt and download file
  const handleDownload = async (file) => {
    try {
      setDownloadingId(file.id);
      setError("");

      const encryptedFile = encryptedFiles.find(
        (item) => item.id === file.id
      );

      if (!encryptedFile || !rsaKeys) {
        alert("Encryption key is unavailable for this file.");
        return;
      }

      // RSA unwrap + AES decrypt
      const decryptedBlob = await decryptFile(
        encryptedFile.encryptedBlob,
        encryptedFile.wrappedKey,
        rsaKeys.privateKey,
        file.mimeType
      );

      // Download original file
      const downloadUrl = URL.createObjectURL(decryptedBlob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

    } catch (err) {
      console.error("Decryption error:", err);
      setError("Decryption failed. The key or encrypted data may be invalid.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete file
  const deleteFile = (id) => {
    setFiles((previousFiles) =>
      previousFiles.filter((file) => file.id !== id)
    );

    setEncryptedFiles((previousFiles) =>
      previousFiles.filter((file) => file.id !== id)
    );
  };

  // File icon
  const getFileIcon = (type) => {
    if (type === "image") return <Image size={22} />;
    if (type === "pdf") return <FileText size={22} />;
    return <File size={22} />;
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-8">

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2">
            <ShieldCheck size={24} />
          </div>

          <h1 className="text-xl font-bold">
            SecureVault
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-400 sm:block">
            Welcome, {currentUser?.name || "User"}
          </span>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("user");
              navigate("/login", { replace: true });
            }}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 hover:bg-white/10"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>

      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            My Dashboard
          </h2>

          <p className="mt-2 text-gray-400">
            Manage your files securely in one place.
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6">
            <FileText className="mb-4 text-blue-400" size={25} />
            <p className="text-gray-400">Total Files</p>
            <h3 className="mt-2 text-3xl font-bold">
              {files.length}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6">
            <HardDrive className="mb-4 text-purple-400" size={25} />
            <p className="text-gray-400">Storage Used</p>
            <h3 className="mt-2 text-3xl font-bold">
              {formatStorage(totalStorage)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6">
            <LockKeyhole className="mb-4 text-green-400" size={25} />
            <p className="text-gray-400">Security Status</p>
            <h3 className="mt-2 text-xl font-bold">
              AES + RSA-OAEP
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Hybrid encryption
            </p>
          </div>

        </div>

        {/* Upload Section */}
        <div className="mb-8 rounded-2xl border border-dashed border-blue-500/50 bg-blue-500/5 p-10 text-center">

          <Cloud className="mx-auto mb-4 text-blue-400" size={40} />

          <h3 className="text-xl font-semibold">
            Upload Your Files
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            AES-256-GCM encrypts files and RSA-OAEP protects their keys.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={openFilePicker}
            disabled={uploading || keyLoading || !rsaKeys}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={18} />
            {keyLoading
              ? "Initializing..."
              : uploading
              ? "Encrypting..."
              : "Upload File"}
          </button>

          {uploading && (
            <p className="mt-3 text-sm text-blue-400">
              Encrypting file and protecting AES key...
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

        </div>

        {/* My Files */}
        <div className="rounded-2xl border border-white/10 bg-[#111a2e] p-6">

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h3 className="text-xl font-semibold">
                My Files
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Your uploaded documents
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
              <Search size={18} className="text-gray-400" />

              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none sm:w-48"
              />
            </div>

          </div>

          {/* File List */}
          <div className="space-y-3">

            {filteredFiles.map((file) => (

              <div
                key={file.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"
              >

                <div className="flex items-center gap-4">

                  <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
                    {getFileIcon(file.type)}
                  </div>

                  <div>
                    <p className="font-medium">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {file.size} • {file.date}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`flex items-center gap-1 text-xs ${
                      file.isEncrypted
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    <LockKeyhole size={14} />
                    {file.isEncrypted ? "Encrypted" : "Demo"}
                  </span>

                  <button
                    onClick={() => handleDownload(file)}
                    disabled={!file.isEncrypted || downloadingId === file.id}
                    title="Decrypt and download"
                    className="rounded-lg p-2 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {downloadingId === file.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <Download size={18} />
                    )}
                  </button>

                  <button
                    onClick={() => deleteFile(file.id)}
                    title="Delete file"
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>

            ))}

            {filteredFiles.length === 0 && (
              <p className="py-8 text-center text-gray-400">
                No files found.
              </p>
            )}

          </div>

        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

          <ShieldCheck className="mt-1 shrink-0 text-blue-400" />

          <p className="text-sm leading-6 text-gray-400">
            Files use AES-256-GCM encryption. Their AES keys
            are wrapped using RSA-OAEP. This demo keeps the RSA
            private key and encrypted files in browser memory.
            Persistent key management and cloud storage are
            not connected yet.
          </p>

        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          SecureVault • Frontend Demo
        </p>

      </main>
    </div>
  );
}

export default Dashboard;
