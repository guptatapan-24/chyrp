"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function TopBar() {
  const { data: session, status } = useSession();

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-900 shadow">
      <h1 className="text-2xl font-bold text-indigo-600">Modern Chyrp</h1>
      <div>
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <div className="flex items-center gap-2">
            {/* User badge */}
            <span className="bg-indigo-500 text-white rounded-full px-3 py-1 text-sm font-medium">
              {session.user.username?.charAt(0).toUpperCase() ?? "U"}
            </span>
            <span className="text-sm">{session.user.username}</span>
            <button
              onClick={() => signOut()}
              className="
    bg-white text-black
    dark:bg-gray-800 dark:text-white
    border border-gray-300 dark:border-gray-600
    px-4 py-2 rounded transition
    hover:bg-gray-100 dark:hover:bg-gray-700
  "
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
          >
            Login / Sign up
          </button>
        )}
      </div>
    </header>
  );
}
