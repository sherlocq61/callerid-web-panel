import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
    permission: string | string[]
    children: React.ReactNode
    fallback?: React.ReactNode
    requireAll?: boolean // If true, requires all permissions. If false, requires any permission
}

export default function PermissionGuard({
    permission,
    children,
    fallback = null,
    requireAll = false
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

    if (loading) {
        return <>{fallback}</>
    }

    const permissions = Array.isArray(permission) ? permission : [permission]

    const hasAccess = requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)

    if (!hasAccess) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
