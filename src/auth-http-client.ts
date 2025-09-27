import axios from 'axios'
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

    constructor( ssoService: SsoService, onFailFunction: Function = () => {}) {
        this.ssoService = ssoService
        this.onFailAction = onFailFunction;
    }

    async get<ResponseType>(url: string): Promise<ResponseType> {
        return this.httpRequest<ResponseType>(() => this.directHttpRequest<ResponseType>("GET", url))
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

    private async directHttpRequest<ResponseType>(method: string, url: string): Promise<ResponseType> {
        let resp = axios<ResponseType>({
            method: method,
            url: url,
            headers: tokenStorage.header()
        })
        return (await resp).data
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
