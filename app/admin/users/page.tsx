"use client"

import { useEffect, useState } from "react"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar" // ADD THIS

type Role = "admin" | "manager" | "staff" | "viewer"

interface UserProfile {
  user_id: string
  email: string
  full_name: string | null
  role: Role
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [cart] = useState([]) // ADD THIS - empty cart for admin

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users").catch(() => null)
      if (!res || !res.ok) {
        throw new Error("User management API not available")
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const updateRole = async (userId: string, role: Role) => {
    setSavingId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      }).catch(() => null)
      if (!res || !res.ok) {
        throw new Error("Error updating role")
      }
      await loadUsers()
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error updating role")
    } finally {
      setSavingId(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return
    setSavingId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => null)
      if (!res || !res.ok) {
        throw new Error("Error deleting user")
      }
      await loadUsers()
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error deleting user")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <ProtectedContent requiredRole="admin">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} /> {/* ADD THIS */}
        <div className="py-8 px-4 sm:px-20"> {/* FIXED: Match other admin pages padding */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                Users
              </h1>
              <p className="text-sm text-amber-800/80">
                Manage access and roles for your team.
              </p>
            </div>

            {loading && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-amber-50 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-amber-50 text-amber-900">
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.user_id}
                        className="border-t border-amber-100 hover:bg-amber-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 text-amber-900">
                          {u.full_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-amber-900/90">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={savingId === u.user_id}
                            onChange={(e) =>
                              updateRole(u.user_id, e.target.value as Role)
                            }
                            className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === u.user_id}
                            onClick={() => deleteUser(u.user_id)}
                            className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-50 text-xs"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {!users.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-sm text-amber-800/80"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}