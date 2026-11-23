import { PostEditor } from '@/components/admin/PostEditor';

export const metadata = { title: '编辑文章' };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditor postId={Number(id)} />;
}
