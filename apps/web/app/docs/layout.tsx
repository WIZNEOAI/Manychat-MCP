import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[220px_1fr] lg:gap-12">
      <DocsSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
