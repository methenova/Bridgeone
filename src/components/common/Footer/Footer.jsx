import { Container } from "../Container";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container>

        <div className="flex flex-col items-center justify-between gap-4 py-10 text-center md:flex-row">

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              BridgeOne
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              India's Live Video Shopping Platform.
            </p>

          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} BridgeOne. All rights reserved.
          </p>

        </div>

      </Container>
    </footer>
  );
}