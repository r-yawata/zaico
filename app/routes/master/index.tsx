import { Outlet } from "react-router";

export default function MasterLayout() {
  return (
    <div className="bg-white p-4">
      <Outlet />
    </div>
  );
} 