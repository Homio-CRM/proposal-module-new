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
        
        console.log('📥 LOGIN - Dados recebidos:', {
            userId: userData.userId,
            email: userData.email,
            role: userData.role,
            type: userData.type,
            activeLocation: userData.activeLocation,
            userName: userData.userName,
            companyId: userData.companyId
        })
        
        if (!validateUserRole(userData.role)) {
            console.log('❌ LOGIN - Role inválida:', userData.role)
            return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
        }
        
        console.log('✅ LOGIN - Role válida:', userData.role)

        if (process.env.NODE_ENV === 'development') {
            console.log('✅ LOGIN - Development mode - criando/atualizando usuário e profile reais no Supabase')
            console.log('📊 LOGIN - Dados recebidos:', JSON.stringify(userData, null, 2))

            const devPassword = 'dev_password_123'
            console.log('🔑 LOGIN - Senha de desenvolvimento:', devPassword)

            console.log('🔍 LOGIN - Listando usuários existentes no Supabase')
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
            console.log('📋 LOGIN - Total de usuários encontrados:', users.length)
            
            const existingUser = users.find(user => user.email === userData.email)
            console.log('👤 LOGIN - Usuário existente encontrado:', !!existingUser)

            let userId: string
            if (!existingUser) {
                console.log('👤 LOGIN - Criando novo usuário no Supabase')
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
                    console.error('❌ LOGIN - Erro ao criar usuário:', createError)
                    throw new Error('Failed to create user (dev)')
                }

                userId = newUser.user.id
                console.log('✅ LOGIN - Usuário criado (dev):', userId)
            } else {
                userId = existingUser.id
                console.log('👤 LOGIN - Usuário existente encontrado, atualizando senha para ID:', userId)
                await supabaseAdmin.auth.admin.updateUserById(userId, { password: devPassword })
                console.log('♻️ LOGIN - Usuário existente (dev) atualizado:', userId)
            }

            console.log('💾 LOGIN - Upserting profile no banco de dados')
            const profileResult = await supabaseAdmin.from('profiles').upsert({
                id: userId,
                agency_id: userData.activeLocation,
                homio_user_id: userData.userId,
                email: userData.email,
                role: userData.role
            })
            console.log('✅ LOGIN - Profile upserted:', profileResult)

            console.log('🔐 LOGIN - Tentando fazer sign in com Supabase')
            const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: devPassword,
            }) as { data: { session: { access_token: string; refresh_token: string } | null } | null; error: Error | null }

            if (signInError || !sessionData?.session) {
                console.error('❌ LOGIN - Erro no sign in:', signInError)
                throw new Error('Failed to sign in user (dev)')
            }

            console.log('✅ LOGIN - Sign in realizado com sucesso')
            console.log('🎫 LOGIN - Access token gerado:', sessionData.session.access_token.substring(0, 20) + '...')
            console.log('🔄 LOGIN - Refresh token gerado:', sessionData.session.refresh_token.substring(0, 20) + '...')

            return NextResponse.json({
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user: { id: userId, ...userData }
            })
        }

        console.log('🔐 LOGIN - Iniciando fluxo de autenticação real (Supabase Admin)')
        console.log('🔍 LOGIN - Listando usuários existentes no Supabase (produção)')
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        console.log('📋 LOGIN - Total de usuários encontrados:', users.length)
        
        const existingUser = users.find(user => user.email === userData.email)
        console.log('👤 LOGIN - Usuário existente encontrado:', !!existingUser)

        let userId: string
        const userPassword = `homio_${userData.userId}_${Date.now()}`
        console.log('🔑 LOGIN - Senha gerada para usuário:', userPassword.substring(0, 15) + '...')

        if (!existingUser) {
            console.log('👤 LOGIN - Criando novo usuário no Supabase (produção)')
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
                console.error('❌ LOGIN - Erro ao criar usuário:', createError)
                throw new Error('Failed to create user')
            }
            
            userId = newUser.user.id
            console.log('✅ LOGIN - Usuário criado com sucesso:', userId)
        } else {
            userId = existingUser.id
            console.log('👤 LOGIN - Usuário existente encontrado, atualizando senha para ID:', userId)
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: userPassword })
            console.log('♻️ LOGIN - Usuário existente atualizado:', userId)
        }

        console.log('💾 LOGIN - Upserting profile no banco de dados (produção)')
        const profileResult = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            agency_id: userData.activeLocation,
            homio_user_id: userData.userId,
            email: userData.email,
            role: userData.role
        })
        console.log('✅ LOGIN - Profile upserted:', profileResult)

        console.log('🔐 LOGIN - Tentando fazer sign in com Supabase (produção)')
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userPassword,
        }) as { data: { session: { access_token: string; refresh_token: string } | null } | null; error: Error | null }

        if (signInError || !sessionData?.session) {
            console.error('❌ LOGIN - Erro no sign in:', signInError)
            throw new Error('Failed to sign in user')
        }

        console.log('✅ LOGIN - Sign in realizado com sucesso (produção)')
        console.log('🎫 LOGIN - Access token gerado:', sessionData.session.access_token.substring(0, 20) + '...')
        console.log('🔄 LOGIN - Refresh token gerado:', sessionData.session.refresh_token.substring(0, 20) + '...')

        return NextResponse.json({
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            user: { id: userId, ...userData }
        })

    } catch (error) {
        console.error('❌ LOGIN - Erro no processo de login:', error)
        console.error('❌ LOGIN - Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unknown error occurred' },
            { status: 500 }
        )
    }
}
