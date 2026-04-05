"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { createOrUpdateUserProfile } from "@/lib/chatService"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && user.emailVerified) {
      createOrUpdateUserProfile(user)
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme)
    } else {
      document.documentElement.setAttribute("data-theme", "dark")
    }
  }, [])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter"
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return "Password must contain at least one special character"
    return null
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return null
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError("Display name is required")
          return
        }
        await signUpWithEmail(email, password, displayName)
        showToast(
          "Verification email sent! Please check your inbox or spam folder.",
          "success",
        )
        setEmail("")
        setPassword("")
        setDisplayName("")
        setIsSignUp(false)
      } else {
        await signInWithEmail(email, password)
        showToast("Signed in successfully!", "success")
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      showToast("Signed in successfully!", "success")
    } catch (error) {
      console.error("Sign in failed:", error)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100 py-8">
      <div className="w-full max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Image src="/Kothaa_icon.png" alt="Kothaa" width={64} height={64} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-base-content mb-2">
          Kothaa
        </h1>
        <p className="text-center text-base-content/60 mb-8">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-base-200 text-base-content px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-base-200 text-base-content px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-base-200 text-base-content px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-primary-content font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* Toggle Sign Up/Sign In */}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError("")
          }}
          className="w-full text-center text-primary hover:underline mb-4"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-base-300"></div>
          <span className="text-base-content/50 text-sm">OR</span>
          <div className="flex-1 border-t border-base-300"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-base-200 hover:bg-base-300 active:bg-base-100 transition-all duration-200 text-base-content font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 border border-base-300"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p className="text-center text-base-content/40 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
