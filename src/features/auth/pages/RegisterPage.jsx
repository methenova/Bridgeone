import LoginHeader from "../components/LoginHeader";
import LoginIllustration from "../components/LoginIllustration";
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-between border-r border-slate-200 p-16">

          <LoginHeader />

          <LoginIllustration />

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-8 lg:p-16">

          <RegisterForm />

        </div>

      </div>
    </div>
  );
}