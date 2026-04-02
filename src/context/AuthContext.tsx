import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, Customer, UserRole } from '#/types/index'
import { users } from '#/data/users'
import { customers } from '#/data/customers'

export type AuthUser = (User | Customer) & { role: UserRole }

interface AuthContextValue {
  currentUser: AuthUser | null
  role: UserRole | null
  login: (email: string, password: string, storeCustomers?: Customer[]) => boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const login = (email: string, password: string, storeCustomers?: Customer[]): boolean => {
    // Check admin/staff users first
    const user = users.find((u) => u.email === email && u.password === password)
    if (user) {
      setCurrentUser(user as AuthUser)
      return true
    }

    // Check store customers first (if provided), then fall back to static customers
    const customerList = storeCustomers ?? customers
    const customer = customerList.find((c) => c.email === email && c.password === password)
    if (customer) {
      setCurrentUser({ ...customer, role: 'customer' as UserRole })
      return true
    }

    return false
  }

  const logout = () => setCurrentUser(null)

  return (
    <AuthContext.Provider
      value={{ currentUser, role: currentUser?.role ?? null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
