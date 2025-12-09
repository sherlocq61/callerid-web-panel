import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const body = await request.json()

        const { email, password, full_name, role, permissions } = body

        // Validate input
        if (!email || !password || !full_name || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Check if owner has a team
        const { data: teamMember } = await supabase
            .from('team_members')
            .select('team_id, role')
            .eq('user_id', owner.id)
            .single()

        if (!teamMember || teamMember.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only team owners can create sub-accounts' },
                { status: 403 }
            )
        }

        // Check team member limit
        const { data: team } = await supabase
            .from('teams')
            .select('max_members')
            .eq('id', teamMember.team_id)
            .single()

        const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamMember.team_id)

        if (count && team && count >= team.max_members) {
            return NextResponse.json(
                { error: `Maximum ${team.max_members} team members allowed` },
                { status: 400 }
            )
        }

        // Create user using Admin API
        // Note: This requires SUPABASE_SERVICE_ROLE_KEY environment variable
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                created_by_owner: true,
                owner_user_id: owner.id
            }
        })

        if (createError || !newUser.user) {
            return NextResponse.json(
                { error: createError?.message || 'Failed to create user' },
                { status: 500 }
            )
        }

        // Add to team_members
        const { data: newTeamMember, error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: teamMember.team_id,
                user_id: newUser.user.id,
                role,
                created_by_owner: true,
                owner_user_id: owner.id,
                must_change_password: true,
                status: 'active'
            })
            .select()
            .single()

        if (memberError) {
            // Rollback: delete created user
            await supabase.auth.admin.deleteUser(newUser.user.id)
            return NextResponse.json(
                { error: 'Failed to add user to team' },
                { status: 500 }
            )
        }

        // Add permissions
        if (permissions && permissions.length > 0) {
            const permissionRecords = permissions.map((perm: string) => ({
                team_member_id: newTeamMember.id,
                permission: perm
            }))

            await supabase
                .from('team_member_permissions')
                .insert(permissionRecords)
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                full_name
            }
        })

    } catch (error) {
        console.error('Error creating sub-account:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
