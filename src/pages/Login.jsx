import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function login(e) {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    navigate('/admin')
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1d26] p-8"
      >
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
          Staff Access
        </p>

        <h1 className="mt-3 text-3xl font-black">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Baba Ji Parts internal system.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            {message}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl bg-[#0f1219] p-4 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-[#0f1219] p-4 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full rounded-xl bg-yellow-400 px-5 py-4 font-black text-black">
            Login
          </button>
        </div>
      </form>
    </main>
  )
}