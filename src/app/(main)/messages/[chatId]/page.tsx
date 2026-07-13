import { notFound } from "next/navigation";

import { ChatWindowView } from "./ChatWindowView";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const id = Number(chatId);
  if (!Number.isInteger(id)) notFound();

  return <ChatWindowView chatId={id} />;
}
