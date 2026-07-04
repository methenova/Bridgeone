import LogoIcon from "./LogoIcon";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoIcon />

      <div>
        <h2 className="text-2xl font-bold">BridgeOne</h2>

        <p className="text-sm text-muted-foreground">
          Live Video Commerce
        </p>
      </div>
    </div>
  );
}