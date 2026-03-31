"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  const activeTab = pathname.startsWith("/users") ? "users" : "chats";
  const isChatPage = pathname.startsWith("/chat/");

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Desktop Sidebar - Left Navigation */}
      <div className="hidden md:flex flex-col w-16 bg-base-200 border-r border-base-300 fixed left-0 top-0 h-screen">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
          {/* Chats Button */}
          <button
            onClick={() => router.push("/chats")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              activeTab === "chats"
                ? "bg-primary shadow-lg shadow-primary/50 text-white"
                : "bg-base-300 hover:bg-base-100 text-base-content/70 hover:text-base-content"
            }`}
            title="Chats"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2em" />
            </svg>
          </button>

          {/* Users Button */}
          <button
            onClick={() => router.push("/users")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              activeTab === "users"
                ? "bg-primary shadow-lg shadow-primary/50 text-white"
                : "bg-base-300 hover:bg-base-100 text-base-content/70 hover:text-base-content"
            }`}
            title="Users"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </button>
        </div>

        {/* User avatar and Settings/Logout at bottom */}
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="relative group">
            {user?.photoURL && (
              <Image
                width={40}
                height={40}
                className="rounded-full cursor-pointer hover:shadow-lg transition-shadow"
                src={user.photoURL}
                alt={user.displayName || "User"}
              />
            )}

            {/* Logout tooltip */}
            <div className="absolute left-16 bottom-0 whitespace-nowrap bg-base-300 text-base-content px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {user?.displayName}
            </div>
          </div>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-full bg-base-300 hover:bg-base-100 flex items-center justify-center text-base-content/70 hover:text-base-content transition-colors relative group"
            title="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>

            {/* Menu tooltip */}
            <div className="absolute left-16 bottom-0 whitespace-nowrap bg-base-300 text-base-content px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Menu
            </div>
          </button>

          {showMenu && (
            <div className="absolute bottom-20 left-16 bg-base-300 rounded-lg p-2 shadow-lg z-50 min-w-[150px]">
              <div className="px-4 py-2 text-xs font-semibold text-base-content/70 uppercase tracking-wider">Theme</div>
              <button
                onClick={() => { handleThemeChange("light"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Light
              </button>
              <button
                onClick={() => { handleThemeChange("dark"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Dark
              </button>
              <div className="my-1 border-t border-gray-700"></div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-red-900/50 rounded text-sm text-red-500 transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - hidden when inside a chat */}
      {!isChatPage && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 flex gap-0 z-50">
        <button
          onClick={() => router.push("/chats")}
          className={`flex-1 py-4 px-4 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            activeTab === "chats"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2em" />
          </svg>
          <span className="text-xs">Chats</span>
        </button>

        <button
          onClick={() => router.push("/users")}
          className={`flex-1 py-4 px-4 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            activeTab === "users"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-xs">Users</span>
        </button>

        <div className="relative flex flex-1">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex-1 py-4 px-4 flex flex-col items-center justify-center gap-1 text-base-content/70 hover:text-base-content transition-all duration-300 w-full"
            title="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs">Menu</span>
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-base-300 rounded-lg p-2 shadow-lg z-50">
              <div className="px-4 py-2 text-xs font-semibold text-base-content/70 uppercase tracking-wider">Theme</div>
              <button
                onClick={() => { handleThemeChange("light"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Light
              </button>
              <button
                onClick={() => { handleThemeChange("dark"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Dark
              </button>
              <div className="my-1 border-t border-gray-700"></div>
              <button
                onClick={() => { handleLogout(); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-red-900/50 rounded text-sm text-red-500 transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
