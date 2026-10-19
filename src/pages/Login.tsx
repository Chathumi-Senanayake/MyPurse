
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Wallet, Leaf } from "lucide-react";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(result.user, {
          displayName: name.trim(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;

      const messages: Record<string, string> = {
        "auth/email-already-in-use": "This email already has an account. Please sign in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/weak-password": "Please use a stronger password with at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      };

      setError(messages[code ?? ""] ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string }).code;

      setError(
        code === "auth/popup-closed-by-user"
          ? "The Google sign-in window was closed."
          : "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6F0] p-5">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <div className="flex flex-col justify-center bg-gradient-to-br from-[#DDE9D9] to-[#A8C3A5] p-8 md:p-12">
          <div className="mb-10 flex items-center gap-2 text-2xl font-bold text-[#254735]">
            <Leaf size={28} />
            MyPurse
          </div>

          <Wallet size={54} className="mb-6 text-[#315B3D]" />

          <h1 className="text-4xl font-bold leading-tight text-[#254735]">
            Your money.
            <br />
            Your control.
          </h1>

          <p className="mt-4 max-w-sm leading-7 text-[#49634D]">
            A calmer way to manage your expenses, budgets, and personal loans.
          </p>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#739078]">
            Welcome to MyPurse
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#263D30]">
            {isRegistering ? "Create your account" : "Welcome back"}
          </h2>

          <p className="mt-3 text-[#718074]">
            {isRegistering
              ? "Start your journey towards better money habits."
              : "Sign in to continue to your dashboard."}
          </p>

          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            {isRegistering && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-xl border border-[#D9E1D7] px-4 py-3 outline-none focus:border-[#759779]"
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-[#D9E1D7] px-4 py-3 outline-none focus:border-[#759779]"
            />

            <input
              type="password"
              placeholder="Password (at least 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-[#D9E1D7] px-4 py-3 outline-none focus:border-[#759779]"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#315B3D] px-5 py-3 font-semibold text-white transition hover:bg-[#254735] disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-sm text-[#8A978C]">
            <div className="h-px flex-1 bg-[#E1E7DE]" />
            OR
            <div className="h-px flex-1 bg-[#E1E7DE]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D9E1D7] px-5 py-3 font-semibold text-[#34483A] transition hover:bg-[#F3F6F0] disabled:opacity-60"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              className="h-5 w-5"
            />
            Continue with Google
          </button>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-[#718074]">
            {isRegistering
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="font-semibold text-[#315B3D] hover:underline"
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
