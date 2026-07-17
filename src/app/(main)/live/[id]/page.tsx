import { LiveRoomView } from "./LiveRoomView";

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveRoomView streamId={Number(id)} />;
}
