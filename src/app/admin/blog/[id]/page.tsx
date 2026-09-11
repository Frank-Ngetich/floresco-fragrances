import { BlogEditor } from '@/components/admin/BlogEditor';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  return <BlogEditor postId={params.id} />;
}
