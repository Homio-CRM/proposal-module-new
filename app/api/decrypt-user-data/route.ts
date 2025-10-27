import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import type { UserData } from '@/lib/types/core'

interface RequestBody {
    encryptedData: string
}

function decryptUserData(encryptedUserData: string, sharedSecretKey: string): UserData {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedUserData, sharedSecretKey).toString(CryptoJS.enc.Utf8)
        const userData = JSON.parse(decrypted)
        return userData
    } catch (error) {
        throw new Error('Failed to decrypt user data')
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<UserData | { error: string }>> {
    try {
        if (process.env.NODE_ENV === 'development') {
            const mockData: UserData = {
                userId: "oKD3wYXnvt2LJVvvtL9T",
                companyId: "3PL31w5rI7KFAU9Hfd8Y",
                role: "admin",
                type: "agency",
                activeLocation: "d8voPwkhJK7k7S5xjHcA",
                userName: "Luan Paganucci",
                email: "luan.paganucci@homio.com.br"
            }
            return NextResponse.json(mockData)
        }

        const { encryptedData }: RequestBody = await request.json()
        if (!process.env.HOMIO_APP_SHARED_SECRET) {
            throw new Error('HOMIO_APP_SHARED_SECRET not configured')
        }

        const userData = decryptUserData(encryptedData, process.env.HOMIO_APP_SHARED_SECRET)

        return NextResponse.json(userData)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to decrypt user data' }, { status: 400 })
    }
}
