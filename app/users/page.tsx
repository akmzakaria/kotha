import UsersList from "@/components/UsersList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Kothaa",
};

export default function UsersPage() {
  return <UsersList />;
}
