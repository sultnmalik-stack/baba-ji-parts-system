import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  seo_title: '',
  seo_description: '',
  status: 'Draft',
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [post, setPost] = useState(emptyPost)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    setPosts(data || [])
  }

  function makeSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function updateTitle(value) {
    setPost({
      ...post,
      title: value,
      slug: post.slug || makeSlug(value),
      seo_title: post.seo_title || value,
    })
  }

  async function savePost(e) {
    e.preventDefault()
    setMessage('')

    const payload = {
      ...post,
      slug: post.slug || makeSlug(post.title),
      updated_at: new Date().toISOString(),
    }

    const { error } = editingId
      ? await supabase.from('blog_posts').update(payload).eq('id', editingId)
      : await supabase.from('blog_posts').insert([payload])

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(editingId ? 'Blog post updated.' : 'Blog post created.')
    setPost(emptyPost)
    setEditingId(null)
    fetchPosts()
  }

  function editPost(existingPost) {
    setPost(existingPost)
    setEditingId(existingPost.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deletePost(id) {
    if (!confirm('Delete this blog post?')) return

    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Blog post deleted.')
    fetchPosts()
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-black">Blog Manager</h1>

      {message && (
        <div className="mb-6 rounded-xl bg-yellow-400/10 p-4 text-yellow-300">
          {message}
        </div>
      )}

      <form onSubmit={savePost} className="mb-10 rounded-2xl bg-[#1a1d26] p-6">
        <h2 className="mb-4 text-2xl font-bold">
          {editingId ? 'Edit Blog Post' : 'Create Blog Post'}
        </h2>

        <input
          value={post.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Title e.g Toyota Camry AXVH70 Front Bumper Melbourne"
          className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
          required
        />

        <input
          value={post.slug}
          onChange={(e) => setPost({ ...post, slug: makeSlug(e.target.value) })}
          placeholder="slug"
          className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
          required
        />

        <textarea
          value={post.excerpt}
          onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
          placeholder="Short excerpt"
          className="mb-3 min-h-24 w-full rounded-xl bg-[#0f1219] p-3 text-white"
        />

        <textarea
          value={post.content}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
          placeholder="Full blog content"
          className="mb-3 min-h-72 w-full rounded-xl bg-[#0f1219] p-3 text-white"
        />

        <input
          value={post.seo_title}
          onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
          placeholder="SEO title"
          className="mb-3 w-full rounded-xl bg-[#0f1219] p-3 text-white"
        />

        <textarea
          value={post.seo_description}
          onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
          placeholder="SEO description"
          className="mb-3 min-h-20 w-full rounded-xl bg-[#0f1219] p-3 text-white"
        />

        <select
          value={post.status}
          onChange={(e) => setPost({ ...post, status: e.target.value })}
          className="mb-4 w-full rounded-xl bg-[#0f1219] p-3 text-white"
        >
          <option>Draft</option>
          <option>Published</option>
        </select>

        <button className="w-full rounded-xl bg-green-500 px-5 py-4 font-black text-white">
          {editingId ? 'Update Post' : 'Create Post'}
        </button>
      </form>

      <section className="rounded-2xl bg-[#1a1d26] p-6">
        <h2 className="mb-4 text-2xl font-bold">Posts</h2>

        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl bg-[#0f1219] p-4">
              <p className="font-bold text-yellow-400">{p.title}</p>
              <p className="text-sm text-gray-400">/{p.slug} • {p.status}</p>

              <div className="mt-3 flex gap-2">
                <button onClick={() => editPost(p)} className="rounded bg-blue-500 px-3 py-2 font-bold text-white">
                  Edit
                </button>
                <button onClick={() => deletePost(p.id)} className="rounded bg-red-500 px-3 py-2 font-bold text-white">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}