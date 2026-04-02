import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("currentUserId")

    if (!currentUserId) {
      return NextResponse.json(
        { error: "Current user ID is required" },
        { status: 400 },
      )
    }

    const currentUser = await User.findOne({ uid: currentUserId }).lean()
    
    const restrictedEmail1 = process.env.RESTRICTED_EMAIL_1
    const restrictedEmail2 = process.env.RESTRICTED_EMAIL_2
    
    let query: any = { 
      uid: { $ne: currentUserId },
      emailVerified: true,
      blocked: { $ne: currentUserId }
    }
    
    // If current user is email1, show only email2
    if (currentUser?.email === restrictedEmail1) {
      query.email = restrictedEmail2
    }
    // For other users (except email2), hide email1
    else if (currentUser?.email !== restrictedEmail2) {
      query.email = { $ne: restrictedEmail1 }
    }

    const users = await User.find(query).lean()

    const formattedUsers = users
      .filter((user) => !currentUser?.blocked?.includes(user.uid))
      .map((user) => ({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        status: user.status,
        lastSeen: user.lastSeen,
        friendRequests: user.friendRequests || [],
        friends: user.friends || [],
        blocked: user.blocked || [],
      }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { uid, displayName, email, profileImage, emailVerified } = body

    if (!uid || !displayName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const user = await User.findOneAndUpdate(
      { uid },
      {
        displayName,
        email,
        profileImage: profileImage || "/favicon.ico",
        emailVerified: emailVerified !== undefined ? emailVerified : false,
        status: "online",
        lastSeen: new Date(),
        $setOnInsert: {
          friends: [],
          blocked: [],
          friendRequests: [],
          bio: "",
        },
      },
      { upsert: true, returnDocument: "after" },
    )

    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
      status: user.status,
      lastSeen: user.lastSeen,
    })
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 },
    )
  }
}
