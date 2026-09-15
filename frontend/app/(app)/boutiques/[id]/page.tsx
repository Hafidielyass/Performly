import { redirect } from 'next/navigation';

export default async function BoutiqueIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/boutiques/${id}/tableau-de-bord`);
}
