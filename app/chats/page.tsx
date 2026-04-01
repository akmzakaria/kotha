import ChatsList from "@/components/ChatsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chats - Kothaa",
};

export default function ChatsPage() {
  return <ChatsList />;
}
