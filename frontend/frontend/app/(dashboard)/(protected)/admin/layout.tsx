import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  // // Check if user is admin
  // if (!user || user.role !== 'admin') {
  //   redirect('/not-authorized');
  // }

  return <>{children}</>;
}
