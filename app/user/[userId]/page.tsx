"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = (params?.userId as string) || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId || !user) return;
    getUserProfile(userId, user.uid).then((p) => {
      setProfile(p);
    });
  }, [userId, user]);

  const showSkeleton = !profile;

  if (!profile && !showSkeleton) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-base-content/70">User not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Back Button - Mobile */}
      <div className="md:hidden sticky top-0 bg-base-100 z-10 p-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="h-full flex items-center justify-center py-8">
        <div className="w-full max-w-3xl px-4 md:px-8 space-y-8">
          {/* Back Button - Desktop */}
          <button onClick={() => router.back()} className="hidden md:flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

        {showSkeleton ? (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-base-300 animate-pulse" />
              <div className="h-8 bg-base-300 rounded w-48 animate-pulse" />
            </div>
            <div className="bg-base-200 rounded-xl p-5 md:p-6 animate-pulse">
              <div className="h-6 bg-base-300 rounded w-20 mb-3" />
              <div className="h-4 bg-base-300 rounded w-full mb-2" />
              <div className="h-4 bg-base-300 rounded w-3/4" />
            </div>
            <div className="bg-base-200 rounded-xl p-5 md:p-6 flex justify-between items-center animate-pulse">
              <div className="h-5 bg-base-300 rounded w-24" />
              <div className="h-8 bg-base-300 rounded w-12" />
            </div>
          </>
        ) : (
          <>
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <Image
            width={128} height={128}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-base-300"
            src={profile.profileImage}
            alt={profile.displayName}
          />
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-base-content">{profile.displayName}</h1>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-base-200 rounded-xl p-5 md:p-6">
            <h2 className="font-semibold text-base-content text-lg mb-3">Bio</h2>
            <p className="text-base-content/70 text-base leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Friends count */}
        <div className="bg-base-200 rounded-xl p-5 md:p-6 flex justify-between items-center">
          <span className="text-base-content/70 text-base md:text-lg">Friends</span>
          <span className="font-semibold text-base-content text-xl md:text-2xl">{profile.friends?.length || 0}</span>
        </div>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
