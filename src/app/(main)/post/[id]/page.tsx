import { notFound } from "next/navigation";

import { PostDetailView } from "./PostDetailView";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  return <PostDetailView postId={postId} />;
}
