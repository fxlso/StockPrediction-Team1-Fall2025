// import { useSession } from "../hooks/useSession";
// import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
// import { LoginButton } from "../components/authButtons";

export default function Home() {
  // const { status } = useSession();
  const auth = useAuth();

  // if (status === "loading") return <div>Checking session...</div>;

  // // Already logged in → skip login page
  // if (status === "authenticated") {
  //   return <Navigate to="/dashboard" replace />;
  // }

  // Not logged in → show login button
  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h1>Welcome to User Sentiment</h1>
      <p>Please log in to continue.</p>
      {/* <LoginButton /> */}
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
    </main>
  );
}