import { Outlet } from "react-router"
import Header from '/src/components/Header'
import { LoadingProvider } from '/src/components/LoadingContext'

import './App.module.css'

export default function App() {
    return (
        <LoadingProvider>
            <main>
                <Header />
                <Outlet />
            </main>
        </LoadingProvider>
    )
}