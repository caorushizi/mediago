import type { FC } from "react";
import { AppBootScreen } from "./components/app-boot-screen";
import { AnalyticsConsentNotice } from "./components/analytics-preferences";
import { useAdapterBootstrap } from "./hooks/use-adapter-bootstrap";
import { useAppTheme } from "./hooks/use-app-theme";
import { AuthGuard } from "./hooks/use-auth";
import { useDesktopEvents } from "./hooks/use-desktop-events";
import { useDownloadEvents } from "./hooks/use-download-events";
import { AppRoutes } from "./routes/app-routes";

const App: FC = () => {
  const adapterReady = useAdapterBootstrap();
  useAppTheme();

  useDesktopEvents();
  useDownloadEvents();

  if (!adapterReady) return <AppBootScreen />;

  return (
    <>
      <div className="size-full overflow-hidden">
        <AuthGuard />
        <AppRoutes />
      </div>
      <AnalyticsConsentNotice />
    </>
  );
};

export default App;
