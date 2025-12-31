import AuthGate from "@/components/dashboard/AuthGate";
import ConnectionTabs from "@/components/dashboard/ConnectionTabs";

export const metadata = {
  title: "Dashboard | MUTUALISM",
  description: "View your Farcaster social connections",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-safe sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          FARCASTER SOCIAL GRAPH
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
          YOUR CONNECTIONS
        </h1>
      </div>

      <AuthGate>
        <ConnectionTabs />
      </AuthGate>
    </div>
  );
}
