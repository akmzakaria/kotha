"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile, updateUserProfile, getAllUsers } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/components/ToastProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [bioText, setBioText] = useState("");
  const [nameText, setNameText] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Profile - Kothaa";
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserProfile(user.uid),
      getAllUsers(user.uid),
    ]).then(([p, users]) => {
      setProfile(p);
      setAllUsers(users);
      setBioText(p.bio || "");
      setNameText(p.displayName || "");
    });
  }, [user]);

  const handleSaveBio = async () => {
    if (!user) return;
    setSaving(true);
    await updateUserProfile(user.uid, { bio: bioText });
    setProfile((prev) => prev ? { ...prev, bio: bioText } : prev);
    setEditingBio(false);
    setSaving(false);
  };

  const handleSaveName = async () => {
    if (!user || !nameText.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: nameText.trim() });
      await updateUserProfile(user.uid, { displayName: nameText.trim() });
      setProfile((prev) => prev ? { ...prev, displayName: nameText.trim() } : prev);
      setEditingName(false);
      showToast("Name updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update name:", error);
      showToast("Failed to update name", "error");
    }
    setSaving(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        await updateProfile(user, { photoURL: dataUrl });
        await updateUserProfile(user.uid, { profileImage: dataUrl });
        setProfile((prev) => prev ? { ...prev, profileImage: dataUrl } : prev);
      } catch (error) {
        console.error("Failed to update image:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="h-full flex items-center justify-center overflow-y-auto py-8">
      <div className="w-full max-w-3xl px-4 md:px-8 space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profile.profileImage && profile.profileImage !== "/favicon.ico" ? (
              <Image
                width={128} height={128}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-base-300"
                src={profile.profileImage}
                alt={profile.displayName}
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-base-300 border-4 border-base-300 flex items-center justify-center">
                <svg className="w-16 h-16 md:w-20 md:h-20 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        
        {/* Name */}
        {editingName ? (
          <div className="flex gap-2 items-center flex-wrap justify-center">
            <input
              autoFocus
              value={nameText}
              onChange={(e) => setNameText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              className="bg-base-300 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xl md:text-2xl font-bold text-center min-w-[200px]"
            />
            <button onClick={handleSaveName} disabled={saving} className="text-primary text-sm font-semibold px-3 py-1 hover:bg-primary/10 rounded">Save</button>
            <button onClick={() => { setEditingName(false); setNameText(profile.displayName); }} className="text-base-content/50 text-sm px-3 py-1 hover:bg-base-300 rounded">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-base-content">{profile.displayName}</h1>
            <button onClick={() => setEditingName(true)} className="text-primary text-sm hover:underline">Edit</button>
          </div>
        )}
        <p className="text-base-content/60 text-sm md:text-base">{profile.email}</p>
      </div>

      {/* Bio */}
      <div className="bg-base-200 rounded-xl p-5 md:p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-base-content text-lg">Bio</span>
          {!editingBio && (
            <button onClick={() => setEditingBio(true)} className="text-primary text-sm hover:underline">
              {profile.bio ? "Edit" : "Add bio"}
            </button>
          )}
        </div>
        {editingBio ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full bg-base-300 text-base-content px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              placeholder="Write something about yourself..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditingBio(false); setBioText(profile.bio || ""); }} className="px-4 py-2 text-sm text-base-content/60 hover:text-base-content transition-colors rounded-lg hover:bg-base-300">
                Cancel
              </button>
              <button onClick={handleSaveBio} disabled={saving} className="px-6 py-2 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-base-content/70 text-base leading-relaxed">{profile.bio || "No bio yet."}</p>
        )}
      </div>

      {/* Friends count */}
      <div className="bg-base-200 rounded-xl p-5 md:p-6 flex justify-between items-center">
        <span className="text-base-content/70 text-base md:text-lg">Friends</span>
        <span className="font-semibold text-base-content text-xl md:text-2xl">{profile.friends?.length || 0}</span>
      </div>
      </div>
    </div>
  );
}
