import { useSession } from "../hooks/useSession";

export function ProtectedRoute({ children }) {
  const { status } = useSession();

  if (status === "loading") return <div>Checking session…</div>;

  if (status === "unauthenticated") {
    window.location.href = "/api/auth/login";
    return null;
  }

  return children;
}