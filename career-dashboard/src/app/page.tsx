import { DashboardView } from "./dashboard-view";

// Rendered per request so "today" is the real date rather than the build
// date. Without this Next prerenders the page and the dates it contains
// would disagree with the client the day after a build.
export const dynamic = "force-dynamic";

export default function Page() {
  return <DashboardView />;
}
