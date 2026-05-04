import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import Home from './pages/Home'
import Inventory from './pages/Inventory'
import Admin from './pages/Admin'
import Parts from './pages/Parts'
import AdminInventory from './pages/AdminInventory'
import AdminAddStock from './pages/AdminAddStock'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import AdminInvoices from './pages/AdminInvoices'
import AdminInvoiceHistory from './pages/AdminInvoiceHistory'
import AdminBlog from './pages/AdminBlog'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import AdminEbay from './pages/AdminEbay'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0f1219] text-white">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11151f]/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/" className="text-xl font-black tracking-wide">
              Baba Ji Parts
            </Link>

            <nav className="flex flex-wrap gap-4 text-sm text-gray-300">
              <Link to="/" className="hover:text-yellow-400">Home</Link>
              <Link to="/parts" className="hover:text-yellow-400">Parts Catalogue</Link>
              <Link to="/inventory" className="hover:text-yellow-400">Vehicle Stock</Link>
              <Link to="/blog" className="hover:text-yellow-400">Blog</Link>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/parts" element={<Parts />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/add-stock"
            element={
              <ProtectedRoute>
                <AdminAddStock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute>
                <AdminInventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/invoices"
            element={
              <ProtectedRoute>
                <AdminInvoices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/invoices/history"
            element={
              <ProtectedRoute>
                <AdminInvoiceHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute>
                <AdminBlog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ebay"
            element={
              <ProtectedRoute>
                <AdminEbay />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}