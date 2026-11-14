
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";

import {
  generateRSAKeyPair,
  encryptPrivateKey,
  exportPublicKey,
} from "../utils/crypto";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Temporarily keep prepared registration data in memory.
  const [registrationData, setRegistrationData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setError("");
    setRegistrationData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setRegistrationData(null);

    if (Object.values(formData).some((value) => !value.trim())) {
      setError("Please fill all fields");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Generate RSA Key Pair in browser
      const keyPair = await generateRSAKeyPair();

      // STEP 2: Export Public Key
      const publicKey = await exportPublicKey(
        keyPair.publicKey
      );

      // STEP 3: Encrypt Private Key using user password
      const encryptedKeyData = await encryptPrivateKey(
        keyPair.privateKey,
        formData.password
      );

      // STEP 4: Prepare registration payload
      const preparedData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),

        publicKey: publicKey,

        encryptedPrivateKey:
          encryptedKeyData.encryptedPrivateKey,

        salt: encryptedKeyData.salt,

        iv: encryptedKeyData.iv,

        iterations: encryptedKeyData.iterations,

        algorithm: encryptedKeyData.algorithm,

        keyDerivation: encryptedKeyData.keyDerivation,
      };

      // Keep prepared data in memory for the next backend step.
      // Never store the plaintext password or private key.
      setRegistrationData(preparedData);

      setMessage(
        "Cryptographic keys generated and Private Key encrypted successfully!"
      );

      console.log("SecureVault registration preparation successful.");
      console.log("Public Key generated:", Boolean(publicKey));
      console.log(
        "Encrypted Private Key generated:",
        Boolean(encryptedKeyData.encryptedPrivateKey)
      );

    } catch (err) {
      console.error("Registration preparation failed:", err);

      setError(
        err.message || "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080d1a] px-4 py-10 text-white">

      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="rounded-xl bg-blue-600 p-2">
            <ShieldCheck size={27} />
          </div>

          <span className="text-2xl font-bold">
            Secure<span className="text-blue-500">Vault</span>
          </span>
        </Link>

        {/* Register Card */}
        <div className="rounded-2xl border border-gray-800 bg-[#111a2c] p-8 shadow-xl">

          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold">
              Create Your Account
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Start securing your files with SecureVault
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Name
              </label>

              <div className="flex items-center rounded-xl border border-gray-700 bg-[#080d1a] px-4 focus-within:border-blue-500">
                <User size={18} className="text-gray-500" />

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email Address
              </label>

              <div className="flex items-center rounded-xl border border-gray-700 bg-[#080d1a] px-4 focus-within:border-blue-500">
                <Mail size={18} className="text-gray-500" />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="flex items-center rounded-xl border border-gray-700 bg-[#080d1a] px-4 focus-within:border-blue-500">
                <LockKeyhole size={18} className="text-gray-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>

              <div className="flex items-center rounded-xl border border-gray-700 bg-[#080d1a] px-4 focus-within:border-blue-500">
                <LockKeyhole size={18} className="text-gray-500" />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                required
                className="mt-0.5 accent-blue-600"
              />

              I agree to the Terms of Service and Privacy Policy.
            </label>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating Secure Keys...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Login
            </Link>
          </p>

          {/* Cryptography Status */}
          {registrationData && (
            <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">

              <h3 className="mb-3 font-semibold text-blue-400">
                <ShieldCheck size={18} className="mr-2 inline" />
                Cryptography Status
              </h3>

              <div className="space-y-2 text-sm text-gray-300">
                <p>✓ RSA-2048 Key Pair Generated</p>
                <p>✓ Public Key Exported</p>
                <p>✓ PBKDF2 Key Derivation Completed</p>
                <p>✓ Private Key Encrypted with AES-256-GCM</p>
                <p>✓ Registration Data Prepared</p>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Backend and database registration are not connected yet.
              </p>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Register;
