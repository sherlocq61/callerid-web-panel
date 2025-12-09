import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const body = await request.json()

        const { team_member_id, permissions } = body

        // Validate input
        if (!team_member_id || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: 'Invalid input' },
                { status: 400 }
            )
        }

        // Get current user (owner)
        const { data: { user: owner } } = await supabase.auth.getUser()
        if (!owner) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify ownership
        const { data: teamMember } = await supabase
            .from('team_members')
            .select('id, owner_user_id')
            .eq('id', team_member_id)
            .single()

        if (!teamMember || teamMember.owner_user_id !== owner.id) {
            return NextResponse.json(
                { error: 'You can only update permissions for your own team members' },
                { status: 403 }
            )
        }

        // Delete existing permissions
        await supabase
            .from('team_member_permissions')
            .delete()
            .eq('team_member_id', team_member_id)

        // Insert new permissions
        if (permissions.length > 0) {
            const permissionRecords = permissions.map((perm: string) => ({
                team_member_id,
                permission: perm
            }))

            const { error: insertError } = await supabase
                .from('team_member_permissions')
                .insert(permissionRecords)

            if (insertError) {
                return NextResponse.json(
                    { error: 'Failed to update permissions' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error updating permissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
