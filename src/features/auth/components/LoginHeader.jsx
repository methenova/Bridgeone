import Logo from "@/components/common/Logo";

export default function LoginHeader() {
  return (
    <div className="space-y-6">

      <Logo />

      <div className="space-y-4">

        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-400">
          Live Video Commerce
        </span>

        <h1 className="text-5xl font-bold leading-tight">
          Sell Products
          <br />
          Live.
        </h1>

        <p className="max-w-lg text-lg leading-8 text-slate-500">
          Connect instantly with your customers through live video.
          Show products in real time, answer questions and increase
          customer confidence before purchase.
        </p>

      </div>

    </div>
  );
}