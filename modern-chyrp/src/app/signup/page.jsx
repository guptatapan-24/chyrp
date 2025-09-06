"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import  { signIn } from  "next-auth/react";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
    const res = await fetch(`${backendUrl}/api/auth/demo-register`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }).toString(),
    });
    if (res.ok) {
      // Signup success, auto-login using NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });
      if (signInResult.ok) {
        router.push("/");  // redirect to homepage or dashboard
      } else {
        setError("Signup succeeded but login failed, please login manually.");
      }
    } else {
      const data = await res.json();
      setError(data.detail || "Failed to register user");
    }
  } catch (err) {
    console.error("Signup error:", err);
    setError("Network error, please try again");
  }
  setLoading(false);
}

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
