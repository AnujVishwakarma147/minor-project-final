import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  contentStyle: { background: "#0d1426", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" },
  cursor: { fill: "rgba(255,255,255,0.05)" },
};
const axis = { stroke: "#64748b", fontSize: 12, tickLine: false, axisLine: false };

const label = (name, index) => {
  if (!name || name === "Encrypted file" || name === "Unable to decrypt filename") return `File ${index + 1}`;
  return name.length > 12 ? `${name.slice(0, 11)}…` : name;
};

function Empty({ children }) {
  return <div className="flex h-64 items-center justify-center text-center text-sm text-gray-500">{children}</div>;
}

export default function StatsTab({ files, timings }) {
  const sizes = [...files].reverse().map((file, i) => ({ name: label(file.name, i), KB: +(file.size / 1024).toFixed(1) }));
  const times = timings.map((t, i) => ({ name: label(t.name, i), Encrypt: t.encryptMs, Upload: t.uploadMs }));

  return (
    <section className="fade-in grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Encrypted size per file</h3>
        <p className="mt-1 mb-4 text-sm text-gray-400">Size of the ciphertext stored on the server (KB).</p>
        {sizes.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizes}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="KB" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty>No files yet.</Empty>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Encrypt vs upload time</h3>
        <p className="mt-1 mb-4 text-sm text-gray-400">Measured in this session (milliseconds). Encryption cost is small.</p>
        {times.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={times}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="Encrypt" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Upload" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty>Upload a file in this session to see timings.</Empty>
        )}
      </div>
    </section>
  );
}
