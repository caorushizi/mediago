import { ImportBehaviourCard } from "./components/ImportBehaviourCard";
import { RuleListCard } from "./components/RuleListCard";
import { ServerCard } from "./components/ServerCard";

export function App() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4">
        <header className="flex items-center gap-3">
          <img
            src="/public/icons/mediago-48.png"
            alt=""
            width={28}
            height={28}
          />
          <h1 className="text-lg font-semibold">MediaGo 扩展设置</h1>
        </header>
        <ServerCard />
        <ImportBehaviourCard />
        <RuleListCard />
      </div>
    </div>
  );
}
