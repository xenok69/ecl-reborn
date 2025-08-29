import { Outlet } from "react-router"
import Header from '/src/components/Header'
import LoadingOverlay from '/src/components/LoadingOverlay'
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
                    <LoadingOverlay />
                </main>
            </LoadingProvider>
        </AuthProvider>
    )
}