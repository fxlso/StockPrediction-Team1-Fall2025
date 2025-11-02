import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
// import "./App.css";
import Navbar from "./components/Navbar";
import { checkSession, logout } from "./api/auth_api";
import type { User } from "./types/user";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Watchlist from "./pages/Watchlist";

function App() {
  const [user, setUser] = useState<User | null>(null);
  // const location = useLocation();

  useEffect(() => {
    verifyLogin();
  }, []);

  async function verifyLogin() {
    console.log("verify before");
    const isUser = await checkSession();
    console.log("user @verifyLogin():", isUser);
    setUser(isUser);
  }

  async function handleLogout() {
    await logout();
    console.log("user logged in?:", user);
    setUser(null);
  }

  return (
    <>
      {/* use conditional renders based on if user is logged in and pass down user object for attributes*/}

      {/* {user && <Navbar user={user} handleLogout={handleLogout} />} */}
      <Navbar user={user} handleLogout={handleLogout} />
      <Routes>
        {/* route for nonlogged-in users */}
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            {/* routes for logged-in users */}
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/watchlist" element={<Watchlist user={user} />} />
            {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
          </>
        )}
      </Routes>
    </>
  );
}

export default App;
