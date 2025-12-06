import axios, { AxiosInstance } from 'axios'
import { SsoService } from './sso-service'
import { tokenStorage } from './token-storage'


type ErrorResponse = {
    code: number
    message: string
    exception: string
}

class UnauthenticatedError extends Error {
}

export class AuthHttpClient {
    private ssoService: SsoService
    private onFailAction: Function;
    private axiosInstance: AxiosInstance

    constructor(apiBaseUrl: string, ssoService: SsoService, onFailFunction: Function = () => {}) {
        this.axiosInstance = axios.create({
            baseURL: apiBaseUrl
        })
        this.ssoService = ssoService
        this.onFailAction = onFailFunction;
    }

    async makeRequest<ResponseType>(requestParams: Record<string, unknown>): Promise<ResponseType> {
        return this.httpRequest<ResponseType>(() => this.directHttpRequest<ResponseType>(requestParams))
    }

    async get<ResponseType>(url: string, params: Record<string, unknown> = {}): Promise<ResponseType> {
        return this.makeRequest<ResponseType>({ method: "GET", url, params })
    }

    async post<ResponseType>(url: string, params: Record<string, unknown> = {}): Promise<ResponseType> {
        return this.makeRequest<ResponseType>({ method: "POST", url, data: params })
    }

    async put<ResponseType>(url: string, params: Record<string, unknown> = {}): Promise<ResponseType> {
        return this.makeRequest<ResponseType>({ method: "PUT", url, data: params })
    }

    async delete<ResponseType>(url: string, params: Record<string, unknown> = {}): Promise<ResponseType> {
        return this.makeRequest<ResponseType>({ method: "DELETE", url, params })
    }

    private async httpRequest<ResponseType>(requestFunction: () => Promise<ResponseType>): Promise<ResponseType> {
        return this.httpRequestTry<ResponseType>(requestFunction)
            .catch(async (error: any) => {
                if (error instanceof UnauthenticatedError) {
                    console.log("Try to refresh token")
                    return await this.ssoService.refreshToken()
                        .then(() => {
                            console.log("Re-sending the request")
                            return this.httpRequestTry<ResponseType>(requestFunction)
                                .catch((error: any) => {
                                    if (this.onFailAction) {
                                        this.onFailAction()
                                    }
                                    throw error
                                })
                        })
                        .catch((refreshError: any) => {
                            console.log("Failed to refresh token, clearing storage")
                            tokenStorage.clear()
                            if (this.onFailAction) {
                                this.onFailAction()
                            }
                            throw refreshError
                        })
                } else {
                    throw error
                }
            })
    }

    private async httpRequestTry<ResponseType>(requestFunction: () => Promise<ResponseType>): Promise<ResponseType> {
        return requestFunction()
            .catch((error: any) => {
                if (this.errorResponseCode(error) == 401 || this.errorResponseCode(error) == 403) {
                    throw new UnauthenticatedError()
                } else {
                    throw new Error(`Request error: ${this.errorResponseMessage(error)}`)
                }
            })
    }

    private async directHttpRequest<ResponseType>(requestParams: Record<string, unknown>): Promise<ResponseType> {
        return this.axiosInstance<ResponseType>({
            ...requestParams,
            ...{ headers: tokenStorage.header() }
        }).then(
            resp => resp.data
        )
        
    }

    private errorResponseMessage(error: any): string {
        let errorMsg = 'An unexpected error occurred'
        if (axios.isAxiosError(error)) {
            errorMsg = error.response!.data
        }
        return errorMsg
    }

    private errorResponseCode(error: any): number {
        let code = 0
        if (axios.isAxiosError(error)) {
            code = error.response!.status
        }
        return code
    }

}
