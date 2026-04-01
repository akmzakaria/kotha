"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { getUserProfile, getUserChats } from "@/lib/chatService";
import { useToast } from "@/components/ToastProvider";

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = React.useState(false);
  const [requestCount, setRequestCount] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  React.useEffect(() => {
    if (!user) return;
    
    const fetchCounts = async () => {
      const [profile, chats] = await Promise.all([
        getUserProfile(user.uid),
        getUserChats(user.uid)
      ]);
      
      setRequestCount(profile.friendRequests?.length || 0);
      
      // Count chats with unread messages
      const unreadChatsCount = chats.filter(chat => 
        (chat.unreadCount?.[user.uid] || 0) > 0
      ).length;
      setUnreadCount(unreadChatsCount);
    };
    
    fetchCounts();
    
    // Poll every 3 seconds
    const interval = setInterval(fetchCounts, 3000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  const getActiveTab = () => {
    if (pathname.startsWith("/users")) return "users";
    if (pathname.startsWith("/friends")) return "friends";
    if (pathname.startsWith("/requests")) return "requests";
    return "chats";
  };
  const activeTab = getActiveTab();
  const isChatPage = pathname.startsWith("/chat/");

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Signed out successfully!", "success");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Desktop Sidebar - Left Navigation */}
      <div className="hidden md:flex flex-col w-16 bg-base-200 border-r border-base-300 fixed left-0 top-0 h-screen z-[100]">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
          {/* Chats Button */}
          <button
            onClick={() => router.push("/chats")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative ${
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
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

          {/* Friends Button */}
          <button
            onClick={() => router.push("/friends")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              activeTab === "friends"
                ? "bg-primary shadow-lg shadow-primary/50 text-white"
                : "bg-base-300 hover:bg-base-100 text-base-content/70 hover:text-base-content"
            }`}
            title="Friends"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </button>

          {/* Requests Button */}
          <button
            onClick={() => router.push("/requests")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              activeTab === "requests"
                ? "bg-primary shadow-lg shadow-primary/50 text-white"
                : "bg-base-300 hover:bg-base-100 text-base-content/70 hover:text-base-content"
            }`}
            title="Friend Requests"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            {requestCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            )}
          </button>
        </div>

        {/* User avatar and Settings/Logout at bottom */}
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="relative" onClick={() => router.push("/profile")} style={{cursor:"pointer"}}>
            {user?.photoURL ? (
              <Image
                width={40}
                height={40}
                className="rounded-full cursor-pointer hover:shadow-lg transition-shadow"
                src={user.photoURL}
                alt={user.displayName || "User"}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
                <svg className="w-6 h-6 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-full bg-base-300 hover:bg-base-100 flex items-center justify-center text-base-content/70 hover:text-base-content transition-colors relative"
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
          </button>

          {showMenu && (
            <div className="absolute bottom-20 left-16 bg-base-300 rounded-lg p-2 shadow-lg z-[9999] min-w-[150px]">
              <button
                onClick={() => { router.push("/blocked"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Blocked Users
              </button>
              <div className="my-1 border-t border-gray-700"></div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 flex gap-0 z-[100]">
        <button
          onClick={() => router.push("/chats")}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative ${
            activeTab === "chats"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2em" />
          </svg>
          <span className="text-xs">Chats</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => router.push("/users")}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            activeTab === "users"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-xs">Users</span>
        </button>

        <button
          onClick={() => router.push("/friends")}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            activeTab === "friends"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span className="text-xs">Friends</span>
        </button>

        <button
          onClick={() => router.push("/requests")}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative ${
            activeTab === "requests"
              ? "bg-primary/20 text-primary border-t-2 border-primary"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span className="text-xs">Requests</span>
          {requestCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {requestCount > 99 ? "99+" : requestCount}
            </span>
          )}
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
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-base-300 rounded-lg p-2 shadow-lg z-[9999]">
              <button
                onClick={() => { router.push("/profile"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => { router.push("/blocked"); setShowMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-base-100 rounded text-sm text-base-content transition-colors"
              >
                Blocked Users
              </button>
              <div className="my-1 border-t border-base-content/20"></div>
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
              <div className="my-1 border-t border-base-content/20"></div>
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
