'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, Plus, Search, Shield, Users, UserX, Eye, EyeOff } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'attendant'
  is_active: boolean
  department: string
  employee_id: string
  hire_date: string
  created_at: string
  last_login: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'receptionist',
    department: '',
    employee_id: '',
    hire_date: '',
    password: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [roles, setRoles] = useState<{ value: string; label: string; color: string }[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  const supabase = createClient()
  // const router = useRouter()

  useEffect(() => {
    fetchUsers()
    fetchRolesAndDepartments()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRolesAndDepartments = async () => {
    try {
      // Try to fetch roles from configuration
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('name, label, color')
        .eq('is_active', true)
        .order('name')

      if (rolesError) {
        console.log('User roles table not found, using default values')
        setRoles([
          { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
          { value: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' },
          { value: 'receptionist', label: 'Receptionist', color: 'bg-green-100 text-green-800' },
          { value: 'pharmacist', label: 'Pharmacist', color: 'bg-orange-100 text-orange-800' },
          { value: 'attendant', label: 'Attendant', color: 'bg-yellow-100 text-yellow-800' }
        ])
      } else {
        setRoles(rolesData.map(role => ({
          value: role.name,
          label: role.label || role.name,
          color: role.color || 'bg-gray-100 text-gray-800'
        })))
      }

      // Extract unique departments from existing users
      const { data: usersData } = await supabase
        .from('users')
        .select('department')
        .not('department', 'is', null)

      if (usersData) {
        const uniqueDepartments = Array.from(new Set(
          usersData.map(user => user.department).filter(Boolean)
        ))
        
        if (uniqueDepartments.length > 0) {
          setDepartments(uniqueDepartments)
        } else {
          // Fallback to default departments
          setDepartments([
            'Administration',
            'General Medicine',
            'Pediatrics',
            'Cardiology',
            'Dermatology',
            'Orthopedics',
            'Pharmacy',
            'Reception',
            'Laboratory',
            'Radiology'
          ])
        }
      } else {
        // Fallback to default departments
        setDepartments([
          'Administration',
          'General Medicine',
          'Pediatrics',
          'Cardiology',
          'Dermatology',
          'Orthopedics',
          'Pharmacy',
          'Reception',
          'Laboratory',
          'Radiology'
        ])
      }
    } catch (error) {
      console.error('Error fetching roles and departments:', error)
      // Fallback to default values
      setRoles([
        { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
        { value: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' },
        { value: 'receptionist', label: 'Receptionist', color: 'bg-green-100 text-green-800' }
      ])
      setDepartments(['Administration', 'General Medicine', 'Pharmacy'])
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.email || !formData.full_name) {
      setError('Please fill in required fields')
      return
    }

    try {
      // Get current admin user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const currentUser = userData ? JSON.parse(userData) : null

      if (editingUser) {
        // Update existing user
        const updateData: Partial<User> & { updated_by?: string } = {
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role as "admin" | "doctor" | "receptionist" | "attendant" | "pharmacist",
          department: formData.department,
          employee_id: formData.employee_id,
          ...(formData.hire_date ? { hire_date: formData.hire_date } : {}),
          updated_by: currentUser?.id
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id)

        if (error) throw error
        setSuccess('User updated successfully!')
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password || 'TempPass123!',
          email_confirm: true,
          user_metadata: {
            full_name: formData.full_name,
            role: formData.role
          }
        })

        if (authError) throw authError

        // Insert user record
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            department: formData.department,
            employee_id: formData.employee_id,
            hire_date: formData.hire_date || null,
            is_active: true,
            created_by: currentUser?.id
          }])

        if (insertError) throw insertError
        setSuccess('User created successfully! Default password: TempPass123!')
      }

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role: 'receptionist',
        department: '',
        employee_id: '',
        hire_date: '',
        password: ''
      })
      setEditingUser(null)
      setShowForm(false)
      fetchUsers()
    } catch (error: unknown) {
      console.error('Error saving user:', error)
      setError(error instanceof Error ? error.message : 'Failed to save user')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      setError('Failed to update user status')
    }
  }

  const resetUserPassword = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: 'TempPass123!'
      })

      if (error) throw error
      
      setSuccess('Password reset successfully! New password: TempPass123!')
    } catch (error) {
      console.error('Error resetting password:', error)
      setError('Failed to reset password')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      employee_id: user.employee_id || '',
      hire_date: user.hire_date ? user.hire_date.split('T')[0]! : '',
      password: ''
    })
    setShowForm(true)
  }

  const getRoleConfig = (role: string) => {
    return roles.find(r => r.value === role) || { value: role, label: role, color: 'bg-gray-100 text-gray-800' }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.is_active).length
  const inactiveUsers = users.filter(u => !u.is_active).length
  const adminUsers = users.filter(u => u.role === 'admin').length
  const doctorUsers = users.filter(u => u.role === 'doctor').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage staff accounts and permissions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{adminUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doctors</p>
                <p className="text-2xl font-bold text-blue-600">{doctorUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} users found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Edit User' : 'Add New User'}</CardTitle>
            <CardDescription>
              {editingUser ? 'Update user information and permissions' : 'Create a new staff account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!!editingUser}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <Label htmlFor="password">Password (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Leave empty for default password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Default password will be: TempPass123!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false)
                    setEditingUser(null)
                    setFormData({
                      email: '',
                      full_name: '',
                      phone: '',
                      role: 'receptionist',
                      department: '',
                      employee_id: '',
                      hire_date: '',
                      password: ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Directory ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role)
              
              return (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{user.full_name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                          {roleConfig.label}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Employee ID:</span>
                          <p>{user.employee_id || 'Not set'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Department:</span>
                          <p>{user.department || 'Not assigned'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <p>{user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Hire Date:</span>
                          <p>{user.hire_date ? new Date(user.hire_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <p>{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Last Login:</span>
                          <p>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserPassword(user.id)}
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No users created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}