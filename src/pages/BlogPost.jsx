import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Helmet } from 'react-helmet-async'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    fetchPost()
  }, [slug])

  async function fetchPost() {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'Published')
      .maybeSingle()

    setPost(data)
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-gray-400">Post not found.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* 🔥 SEO */}
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta
          name="description"
          content={post.seo_description || post.excerpt || ''}
        />
      </Helmet>

      <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
        Baba Ji Parts Blog
      </p>

      <h1 className="mt-3 text-4xl font-black">{post.title}</h1>

      <p className="mt-3 text-gray-400">{post.excerpt}</p>

      {/* 🔥 CTA */}
      <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5">
        <p className="font-bold text-yellow-400">
          Need this part in Melbourne?
        </p>

        <p className="mt-2 text-sm text-gray-300">
          Call Baba Ji Parts now or message us for fast pickup or delivery.
        </p>

        <p className="mt-3 text-lg font-black">
          📞 0430 099 873
        </p>
      </div>

      {/* CONTENT */}
      <article className="mt-8 whitespace-pre-line rounded-2xl bg-[#1a1d26] p-6 leading-8 text-gray-200">
        {post.content}
      </article>

      {/* 🔥 INTERNAL LINKS */}
      <div className="mt-10 rounded-2xl bg-[#1a1d26] p-6">
        <h3 className="text-xl font-bold text-yellow-400">
          Looking for more parts?
        </h3>

        <div className="mt-4 flex flex-wrap gap-4">
          <a
            href="/parts"
            className="rounded bg-yellow-400 px-4 py-2 font-bold text-black"
          >
            Browse Parts Catalogue
          </a>

          <a
            href="/inventory"
            className="rounded bg-white/10 px-4 py-2 font-bold"
          >
            View Vehicles
          </a>
        </div>
      </div>
    </main>
  )
}