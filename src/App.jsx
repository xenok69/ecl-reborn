import { Outlet } from "react-router"
import Header from '/src/components/Header'
import { LoadingProvider } from '/src/components/LoadingContext'
import { AuthProvider } from '/src/components/AuthContext'

import './App.module.css'

export default function App() {
    return (
        <AuthProvider>
            <LoadingProvider>
                <main>
                    <Header />
                    <Outlet />
                </main>
            </LoadingProvider>
        </AuthProvider>
    )
}