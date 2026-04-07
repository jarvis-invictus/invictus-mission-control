import Sidebar from "@/components/dashboard/Sidebar";
import DemoGallery from "@/components/demos/DemoGallery";

export default function DemosPage() {
  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <DemoGallery />
      </main>
    </div>
  );
}
