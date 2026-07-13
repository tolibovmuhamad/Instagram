import { MessagesShell } from "./MessagesShell";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <MessagesShell>{children}</MessagesShell>;
}
