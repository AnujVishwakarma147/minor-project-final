import { Download, File, FileText, Image, LockKeyhole, Search, Trash2, Upload } from "lucide-react";

function FileIcon({ name }) {
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return <Image size={22} />;
  if (/\.pdf$/i.test(name)) return <FileText size={22} />;
  return <File size={22} />;
}

export default function FilesTab({ files, query, setQuery, onDownload, onDelete, onUploadClick, activeId, formatSize }) {
  const visible = files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="glass fade-in rounded-2xl p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-semibold">My Files</h3>
          <p className="mt-1 text-sm text-gray-400">Only your account can open these encrypted files.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            aria-label="Search files"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none sm:w-52"
          />
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((file) => (
          <div
            key={file.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-blue-400/30 hover:bg-white/[0.06] sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <FileIcon name={file.name} />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSize(file.size)} · {file.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
                <LockKeyhole size={13} />
                Encrypted
              </span>
              <button
                onClick={() => onDownload(file)}
                disabled={activeId === file.id}
                title="Decrypt and download"
                className="rounded-lg p-2 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => onDelete(file.id)}
                title="Delete file"
                className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {!visible.length && (
          <div className="py-12 text-center">
            <p className="text-gray-400">{files.length ? "No matching files." : "No files yet."}</p>
            {!files.length && (
              <button
                onClick={onUploadClick}
                className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                <Upload size={16} />
                Upload your first file
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
