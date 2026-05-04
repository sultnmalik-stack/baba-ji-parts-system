import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Blog() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })

    setPosts(data || [])
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-4xl font-black">Baba Ji Parts Blog</h1>
      <p className="mt-3 text-gray-400">
        Used parts, wrecking updates, fitment notes and Melbourne auto parts guides.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="rounded-2xl border border-white/10 bg-[#1a1d26] p-6 hover:border-yellow-400"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Baba Ji Parts
            </p>
            <h2 className="mt-2 text-2xl font-black">{post.title}</h2>
            <p className="mt-3 text-sm text-gray-400">{post.excerpt}</p>
            <p className="mt-5 font-bold">Read more →</p>
          </Link>
        ))}
      </div>
    </main>
  )
}