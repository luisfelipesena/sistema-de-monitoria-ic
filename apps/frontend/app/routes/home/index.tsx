"use client"

import { Header } from "@/components/layout/Header"
import { Link } from "react-router"

export default function Home() {
  return (
    <div>
      <Header className="px-4" />
      <main className="p-4">oAAAASASi</main>
      <p>
        <Link to="/auth/sign-in">Ir para login</Link>
      </p>
    </div>
  )
}
