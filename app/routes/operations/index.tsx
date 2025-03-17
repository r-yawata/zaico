import { Outlet } from "react-router";

export default function OperationsLayout() {
  return (
    <div className="space-y-4">
      <Outlet />
    </div>
  );
} 