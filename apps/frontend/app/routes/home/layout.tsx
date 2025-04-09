import { Sidebar } from '@/components/layout/Sidebar';
import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div>
      <Sidebar />
      <Outlet />
    </div>
  );
}
