import AuthGate from "@/components/graph/AuthGate";
import ConnectionTabs from "@/components/graph/ConnectionTabs";
import PageWrapper from "@/components/graph/PageWrapper";

export const metadata = {
  title: "Graph | MUTUALISM",
  description: "View your Farcaster social connections",
};

export default function GraphPage() {
  return (
    <PageWrapper title="YOUR CONNECTIONS" subtitle="FARCASTER SOCIAL GRAPH">
      <AuthGate>
        <ConnectionTabs />
      </AuthGate>
    </PageWrapper>
  );
}
