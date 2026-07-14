import type { ReactNode } from "react";

type DashboardLoadedViewProps = {
  children: ReactNode;
};

export function DashboardLoadedView({ children }: DashboardLoadedViewProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12"
      data-testid="dashboard-loaded-view"
    >
      {children}
    </div>
  );
}
