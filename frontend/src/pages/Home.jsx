
import {
  ShieldCheck,
  LockKeyhole,
  Cloud,
  FileCheck,
  ArrowRight,
  Upload,
  Shield,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: LockKeyhole,
    title: "End-to-End Encryption",
    description:
      "Your files are encrypted before leaving your device using AES-256 encryption.",
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Privacy",
    description:
      "Your private files remain private. The server cannot access your original data.",
  },
  {
    icon: Cloud,
    title: "Secure Cloud Storage",
    description:
      "Store your encrypted files securely and access them whenever you need.",
  },
  {
    icon: KeyRound,
    title: "Advanced Key Protection",
    description:
      "Protect encryption keys using secure asymmetric cryptography.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-600 p-2">
            <ShieldCheck size={25} />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Secure<span className="text-blue-500">Vault</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
          <a href="#features" className="transition hover:text-blue-400">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-blue-400">
            How It Works
          </a>
          <a href="#about" className="transition hover:text-blue-400">
            About
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-lg px-4 py-2 text-sm text-gray-200 transition hover:text-blue-400 sm:block"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <ShieldCheck size={16} />
            Your Privacy, Our Priority
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your Files.
            <br />
            Your Privacy.
            <br />
            <span className="text-blue-500">Your Control.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-gray-400">
            Store your files with confidence. SecureVault uses advanced
            encryption to protect your personal data and keep your files
            private.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-700"
            >
              Get Started
              <ArrowRight size={19} />
            </Link>

            <a
              href="#features"
              className="rounded-xl border border-gray-700 px-6 py-3.5 font-semibold text-gray-200 transition hover:border-blue-500"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-green-400" />
              AES-256 Encryption
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-green-400" />
              Privacy Focused
            </span>
          </div>
        </div>

        {/* Security Illustration */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />

          <div className="relative w-full max-w-md rounded-3xl border border-gray-700/70 bg-[#111a2c] p-8 shadow-2xl shadow-blue-950/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security Status</p>
                <h3 className="mt-1 text-xl font-semibold">
                  Your files are protected
                </h3>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3 text-green-400">
                <ShieldCheck size={27} />
              </div>
            </div>

            <div className="my-9 flex justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/5">
                <div className="absolute inset-4 rounded-full border border-blue-400/20" />
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-600 shadow-xl shadow-blue-600/30">
                  <LockKeyhole size={55} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[#19243a] p-4">
                <div className="flex items-center gap-3">
                  <FileCheck className="text-blue-400" />
                  <span className="text-sm">File Encryption</span>
                </div>
                <span className="text-sm text-green-400">Protected</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#19243a] p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="text-blue-400" />
                  <span className="text-sm">Key Security</span>
                </div>
                <span className="text-sm text-green-400">Enabled</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#19243a] p-4">
                <div className="flex items-center gap-3">
                  <Cloud className="text-blue-400" />
                  <span className="text-sm">Cloud Storage</span>
                </div>
                <span className="text-sm text-green-400">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-gray-800 bg-[#0b1220] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="font-semibold uppercase tracking-widest text-blue-400">
              Powerful Security
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Security You Can Trust
            </h2>
            <p className="mt-5 leading-7 text-gray-400">
              Everything you need to keep your important files safe and private.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-800 bg-[#111a2c] p-7 transition duration-300 hover:-translate-y-2 hover:border-blue-500/60"
                >
                  <div className="mb-6 inline-flex rounded-xl bg-blue-600/15 p-4 text-blue-400">
                    <Icon size={28} />
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="font-semibold uppercase tracking-widest text-blue-400">
              Simple Process
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              How SecureVault Works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Select Your File",
                description: "Choose the file you want to store securely.",
                icon: Upload,
              },
              {
                number: "02",
                title: "Encrypt Your File",
                description: "Your file is encrypted on your device before upload.",
                icon: LockKeyhole,
              },
              {
                number: "03",
                title: "Secure Storage",
                description: "Upload encrypted data to secure cloud storage.",
                icon: Cloud,
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-2xl border border-gray-800 bg-[#111a2c] p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-blue-500/40">
                      {step.number}
                    </span>
                    <Icon size={30} className="text-blue-400" />
                  </div>

                  <h3 className="mt-7 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950 to-[#14264a] px-7 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Take Control of Your Privacy
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-300">
            Your personal files deserve better protection. Start your secure
            storage journey with SecureVault.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold transition hover:bg-blue-700"
          >
            Get Started
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-gray-800 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={23} />
            <span className="font-bold">
              Secure<span className="text-blue-500">Vault</span>
            </span>
          </div>

          <p className="text-center text-sm text-gray-500">
            © 2026 SecureVault. Your Privacy, Our Priority.
          </p>

          <p className="text-sm text-gray-500">
            Built with Security in Mind.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
