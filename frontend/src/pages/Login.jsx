import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  //   const handleSubmit = (e) => {
  //     e.preventDefault();

  //     if (!formData.email || !formData.password) {
  //       alert("Please fill all fields");
  //       return;
  //     }

  //     alert("Login UI working! Backend will be connected later.");
  //   };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    navigate("/dashboard");
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

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-800 bg-[#111a2c] p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
              <LockKeyhole size={28} />
            </div>

            <h1 className="text-2xl font-bold">Welcome Back</h1>

            <p className="mt-2 text-sm text-gray-400">
              Login to access your secure files
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>

              <div className="flex items-center rounded-xl border border-gray-700 bg-[#080d1a] px-4 focus-within:border-blue-500">
                <LockKeyhole size={18} className="text-gray-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Remember me */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox" className="accent-blue-600" />
                Remember me
              </label>

              <a href="#" className="text-blue-400 hover:text-blue-300">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-700"
            >
              Login
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Create Account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Your privacy is protected with SecureVault.
        </p>
      </div>
    </div>
  );
}

export default Login;
