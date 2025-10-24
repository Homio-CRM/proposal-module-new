import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import type { UserData } from '@/lib/types/core'

interface RequestBody {
    encryptedData: string
}

function decryptUserData(encryptedUserData: string, sharedSecretKey: string): UserData {
    try {
        console.log('🔐 DECRYPT - Iniciando processo de decriptação')
        console.log('🔐 DECRYPT - Dados criptografados (primeiros 50 chars):', encryptedUserData.substring(0, 50) + '...')
        console.log('🔐 DECRYPT - Chave compartilhada disponível:', !!sharedSecretKey)
        
        const decrypted = CryptoJS.AES.decrypt(encryptedUserData, sharedSecretKey).toString(CryptoJS.enc.Utf8)
        console.log('🔐 DECRYPT - Dados decriptados (primeiros 100 chars):', decrypted.substring(0, 100) + '...')
        
        const userData = JSON.parse(decrypted)
        console.log('✅ DECRYPT - JSON parse realizado com sucesso')
        
        return userData
    } catch (error) {
        console.error('❌ DECRYPT - Erro na função de decriptação:', error)
        throw new Error('Failed to decrypt user data')
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<UserData | { error: string }>> {
    try {
        console.log('🔍 DECRYPT - POST - NODE_ENV:', process.env.NODE_ENV)
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ DECRYPT - ambiente de desenvolvimento - retornando mock')
            const mockData: UserData = {
                userId: "oKD3wYXnvt2LJVvvtL9T",
                companyId: "3PL31w5rI7KFAU9Hfd8Y",
                role: "admin",
                type: "agency",
                activeLocation: "d8voPwkhJK7k7S5xjHcA",
                userName: "Luan Paganucci",
                email: "luan.paganucci@homio.com.br"
            }
            console.log('📊 DECRYPT - Dados mock retornados:', JSON.stringify(mockData, null, 2))
            return NextResponse.json(mockData)
        }

        const { encryptedData }: RequestBody = await request.json()
        console.log('📥 DECRYPT - Dados criptografados recebidos:', encryptedData.substring(0, 50) + '...')

        if (!process.env.HOMIO_APP_SHARED_SECRET) {
            console.error('❌ DECRYPT - HOMIO_APP_SHARED_SECRET não configurado')
            throw new Error('HOMIO_APP_SHARED_SECRET not configured')
        }

        console.log('🔐 DECRYPT - ambiente de produção - tentando decriptografar dados')
        console.log('🔑 DECRYPT - Chave compartilhada disponível:', !!process.env.HOMIO_APP_SHARED_SECRET)
        
        const userData = decryptUserData(encryptedData, process.env.HOMIO_APP_SHARED_SECRET)
        console.log('✅ DECRYPT - Dados decriptografados com sucesso:', {
            userId: userData.userId,
            email: userData.email,
            role: userData.role,
            type: userData.type,
            activeLocation: userData.activeLocation,
            userName: userData.userName,
            companyId: userData.companyId
        })

        return NextResponse.json(userData)
    } catch (error) {
        console.error('❌ DECRYPT - Erro no processo de decriptação:', error)
        console.error('❌ DECRYPT - Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
        return NextResponse.json({ error: 'Failed to decrypt user data' }, { status: 400 })
    }
}
