import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="flex gap-8">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <Sidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
