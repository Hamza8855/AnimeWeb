import AdminSidebar from "../../components/AdminSidebar";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="flex flex-col lg:flex-row">
        <section className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>

          <p className="mt-3 text-gray-400">Welcome to the admin dashboard.</p>
        </section>
      </div>
    </main>
  );
}
