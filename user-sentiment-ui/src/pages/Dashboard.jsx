// import { useSession } from "../hooks/useSession";
// import { LogoutButton } from "../components/authButtons";
import { useAuth } from "react-oidc-context";

export default function Dashboard() {
  // const { user } = useSession();
  const auth = useAuth();

  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h2>Dashboard</h2>
      <p>Hello</p>
      <button onClick={() => auth.removeUser()}>Sign Out</button>
    </main>
  );
}