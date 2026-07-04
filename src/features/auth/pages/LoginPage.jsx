import LoginHeader from "../components/LoginHeader";
import LoginIllustration from "../components/LoginIllustration";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-between border-r border-slate-800 p-16">

          <LoginHeader />

          <LoginIllustration />

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-8 lg:p-16">

          <LoginForm />

        </div>

      </div>
    </div>
  );
}