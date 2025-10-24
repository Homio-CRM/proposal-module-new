import type { UserData } from '@/lib/types/core'

export class UserDataService {
    private static instance: UserDataService

    static getInstance(): UserDataService {
        if (!UserDataService.instance) {
            UserDataService.instance = new UserDataService()
        }
        return UserDataService.instance
    }

    async getUserData(): Promise<UserData> {
        try {
            console.log('🔍 USER_DATA_SERVICE - Iniciando processo de obtenção de dados do usuário')
            
            const encryptedUserData = await new Promise<string>((resolve, reject) => {
                console.log('📡 USER_DATA_SERVICE - Enviando mensagem REQUEST_USER_DATA para parent window')
                
                window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*")

                const messageHandler = ({ data }: MessageEvent) => {
                    console.log('📨 USER_DATA_SERVICE - Mensagem recebida:', data)
                    
                    if (data.message === "REQUEST_USER_DATA_RESPONSE") {
                        console.log('✅ USER_DATA_SERVICE - Resposta de dados do usuário recebida')
                        window.removeEventListener("message", messageHandler)
                        resolve(data.payload)
                    }
                }

                window.addEventListener("message", messageHandler)

                setTimeout(() => {
                    console.error('❌ USER_DATA_SERVICE - Timeout aguardando resposta do parent window')
                    window.removeEventListener("message", messageHandler)
                    reject(new Error('Timeout waiting for user data response'))
                }, 10000)
            })

            console.log('🔐 USER_DATA_SERVICE - Dados criptografados recebidos, enviando para descriptação')
            console.log('📊 USER_DATA_SERVICE - Dados criptografados (primeiros 50 chars):', encryptedUserData.substring(0, 50) + '...')

            const response = await fetch("/api/decrypt-user-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ encryptedData: encryptedUserData }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ USER_DATA_SERVICE - Erro na resposta da API:', errorData)
                throw new Error(errorData.error || 'Failed to decrypt user data')
            }

            const userData = await response.json()
            console.log('✅ USER_DATA_SERVICE - Dados do usuário descriptografados com sucesso:', {
                userId: userData.userId,
                email: userData.email,
                role: userData.role,
                type: userData.type,
                activeLocation: userData.activeLocation,
                userName: userData.userName,
                companyId: userData.companyId
            })

            return userData
        } catch (error) {
            console.error('❌ USER_DATA_SERVICE - Erro ao obter dados do usuário:', error)
            throw error
        }
    }
}

export const userDataService = UserDataService.getInstance()
