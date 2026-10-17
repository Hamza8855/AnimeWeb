// import Navbar from "../../components/Navbar";
// import AdminSidebar from "../../components/AdminSidebar";

// export default function AdminLayout({ children }) {
//   return (
//     <div className="min-h-screen bg-black text-white">
//       <Navbar />

//       <div className="flex min-h-[calc(100vh-4rem)]">
//         <AdminSidebar />

//         <main className="min-w-0 flex-1 bg-black">{children}</main>
//       </div>
//     </div>
//   );
// }

import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Admin Page Content */}
        <main className="min-w-0 flex-1 bg-black">
          <div className="w-full min-w-0 p-3 sm:p-5 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
