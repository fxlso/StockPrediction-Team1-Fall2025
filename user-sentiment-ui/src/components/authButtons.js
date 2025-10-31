export function LoginButton() {
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };
  return <button onClick={handleLogin}>Log in</button>;
}

export function LogoutButton() {
  const handleLogout = async () => {
    window.location.href = "/api/auth/logout";
  };
  return <button onClick={handleLogout}>Log out</button>;
}