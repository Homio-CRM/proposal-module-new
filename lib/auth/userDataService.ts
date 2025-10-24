import type { UserData } from '@/lib/types/core'

export class UserDataService {
    private static instance: UserDataService
    private isRequesting = false
    private cachedUserData: UserData | null = null
    private requestPromise: Promise<UserData> | null = null

    static getInstance(): UserDataService {
        if (!UserDataService.instance) {
            UserDataService.instance = new UserDataService()
        }
        return UserDataService.instance
    }

    async getUserData(): Promise<UserData> {
        if (this.cachedUserData) {
            return this.cachedUserData
        }

        if (this.isRequesting && this.requestPromise) {
            return this.requestPromise
        }

        this.isRequesting = true
        this.requestPromise = this.fetchUserData()

        try {
            const userData = await this.requestPromise
            this.cachedUserData = userData
            return userData
        } finally {
            this.isRequesting = false
            this.requestPromise = null
        }
    }

    private async fetchUserData(): Promise<UserData> {
        try {
            const encryptedUserData = await new Promise<string>((resolve, reject) => {
                window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*")

                const messageHandler = ({ data }: MessageEvent) => {
                    if (data.message === "REQUEST_USER_DATA_RESPONSE") {
                        window.removeEventListener("message", messageHandler)
                        resolve(data.payload)
                    }
                }

                window.addEventListener("message", messageHandler)

                setTimeout(() => {
                    window.removeEventListener("message", messageHandler)
                    reject(new Error('Timeout waiting for user data response'))
                }, 10000)
            })

            const response = await fetch("/api/decrypt-user-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ encryptedData: encryptedUserData }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to decrypt user data')
            }

            const userData = await response.json()
            return userData
        } catch (error) {
            throw error
        }
    }

    clearCache(): void {
        this.cachedUserData = null
        this.isRequesting = false
        this.requestPromise = null
    }
}

export const userDataService = UserDataService.getInstance()