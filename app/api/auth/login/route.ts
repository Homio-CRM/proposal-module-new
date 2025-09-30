import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserData } from '@/lib/types/core'
import { validateUserRole } from '@/lib/utils/permissions'
import { supabase } from '@/lib/supabaseClient'

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_service_role_key'

const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {}
    }
)

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 auth/login POST - NODE_ENV:', process.env.NODE_ENV)
        const userData: UserData = await req.json()
        
        if (!validateUserRole(userData.role)) {
            return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Development mode - criando/atualizando usuário e profile reais no Supabase')
            console.log('📊 Dados recebidos:', JSON.stringify(userData, null, 2))

            const devPassword = 'dev_password_123'

            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = users.find(user => user.email === userData.email)

            let userId: string
            if (!existingUser) {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: userData.email,
                    password: devPassword,
                    email_confirm: true,
                    user_metadata: {
                        homio_user_id: userData.userId,
                        full_name: userData.userName
                    }
                })

                if (createError || !newUser?.user) {
                    throw new Error('Failed to create user (dev)')
                }

                userId = newUser.user.id
                console.log('✅ Usuário criado (dev):', userId)
            } else {
                userId = existingUser.id
                await supabaseAdmin.auth.admin.updateUserById(userId, { password: devPassword })
                console.log('♻️ Usuário existente (dev) atualizado:', userId)
            }

            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                agency_id: userData.activeLocation,
                homio_user_id: userData.userId,
                email: userData.email,
                role: userData.role
            })

            const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: devPassword,
            })

            if (signInError || !sessionData?.session) {
                throw new Error('Failed to sign in user (dev)')
            }

            return NextResponse.json({
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user: { id: userId, ...userData }
            })
        }

        console.log('🔐 Iniciando fluxo de autenticação real (Supabase Admin)')
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.find(user => user.email === userData.email)

        let userId: string
        const userPassword = `homio_${userData.userId}_${Date.now()}`

        if (!existingUser) {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userPassword,
                email_confirm: true,
                user_metadata: {
                    homio_user_id: userData.userId,
                    full_name: userData.userName
                }
            })
            
            if (createError || !newUser?.user) {
                throw new Error('Failed to create user')
            }
            
            userId = newUser.user.id
        } else {
            userId = existingUser.id
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: userPassword })
        }

        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            agency_id: userData.activeLocation,
            homio_user_id: userData.userId,
            email: userData.email,
            role: userData.role
        })

        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userPassword,
        })

        if (signInError || !sessionData?.session) {
            throw new Error('Failed to sign in user')
        }

        return NextResponse.json({
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            user: { id: userId, ...userData }
        })

    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unknown error occurred' },
            { status: 500 }
        )
    }
}
