
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

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

      // STEP 1: Generate RSA key pair in the browser
      const keyPair = await generateRSAKeyPair();

      // STEP 2: Export the public key
      const publicKey = await exportPublicKey(keyPair.publicKey);

      // STEP 3: Encrypt the private key using the user's password
      const encryptedKeyData = await encryptPrivateKey(
        keyPair.privateKey,
        formData.password
      );

      // STEP 4: Prepare data for backend registration
      const registrationPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        publicKey,
        encryptedPrivateKey:
          encryptedKeyData.encryptedPrivateKey,
        salt: encryptedKeyData.salt,
        iv: encryptedKeyData.iv,
      };

      // STEP 5: Send registration data to backend
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationPayload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      navigate("/", { replace: true });

    } catch (err) {
      console.error("Registration Error:", err);

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
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
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
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Secure Account...
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

        </div>
      </div>
    </div>
  );
}

export default Register;
