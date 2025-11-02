import type { User } from "@/types/user";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

export async function checkSession(): Promise<User | null> {
    console.log("entered")
    try {
            console.log("entered again")

        const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
            credentials: "include",
        });
        console.log('res data: ', res)
        if (!res.ok) {
            return null;
        }
        console.log(res)

        const data: User = await res.json();
        console.log('session data:', data);

        return data
    } catch (error) {
        console.error("Session check error:", error);
        return null;
    }
}

export async function logout(): Promise<void> {
    await fetch(`${BACKEND_URL}/api/auth/logout`);
}