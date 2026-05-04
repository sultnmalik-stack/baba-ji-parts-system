import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1d26] to-[#0f1219] p-10 shadow-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
          Melbourne Auto Wreckers
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-tight">
          Quality Used Auto Parts, Fast Quotes, Real Stock.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-300">
          Baba Ji Parts supplies engines, transmissions, panels, headlights,
          hybrid parts, doors, guards, bumpers and more across Melbourne.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/inventory"
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black"
          >
            View Vehicle Stock
          </Link>

          <a
            href="tel:0400000000"
            className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white"
          >
            Call Now
          </a>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#1a1d26] p-6">
          <h3 className="text-xl font-bold">Toyota Specialists</h3>
          <p className="mt-2 text-gray-400">
            Camry, Corolla, Kluger, Hiace, Hilux, RAV4 and more.
          </p>
        </div>

        <div className="rounded-2xl bg-[#1a1d26] p-6">
          <h3 className="text-xl font-bold">Fast Dispatch</h3>
          <p className="mt-2 text-gray-400">
            Local pickup and freight options available.
          </p>
        </div>

        <div className="rounded-2xl bg-[#1a1d26] p-6">
          <h3 className="text-xl font-bold">Real Yard Stock</h3>
          <p className="mt-2 text-gray-400">
            Live inventory from vehicles currently being dismantled.
          </p>
        </div>
      </section>
    </main>
  )
}