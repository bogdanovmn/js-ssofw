import axios from "axios";
import { tokenStorage } from "./token-storage";

type TemporaryCodeResponse = {
    code: string
}

export type Jwt = {
    token: string
    refreshToken: string
}

export type CreateAccountRequest = {
    accountName: string
    email: string
    password: string
}

export class SsoService {
    private url: string

    constructor(url: string) {
        this.url = url
    }

    public async createNewTokenByCredentials(email: string, password: string): Promise<void> {
        return axios.post<Jwt>(
            this.url + "/jwt",
            { email: email, password: password }
        ).then(
            response => tokenStorage.updateTokens(response.data)
        ).catch((error: any) => {
            console.log(`Can't get JWT using email "${email}"`)
            console.log(error)
            throw(error)
        })
    }

    public async exchangeCredentialsToCode(email: string, password: string): Promise<string> {
        return axios.post<TemporaryCodeResponse>(
            this.url + "/sso/code",
            { email: email, password: password }
        ).then(
            response => response.data.code
        ).catch((error: any) => {
            console.log(`Can't get temporary code using email "${email}"`)
            console.log(error)
            throw(error)
        })
    }

    public async exchangeJwtToCode(): Promise<string> {
        return axios.put<TemporaryCodeResponse>(
            this.url + "/sso/jwt",
            {},
            { headers: tokenStorage.header()}
        ).then(
            response => response.data.code
        ).catch((error: any) => {
            console.log(`Can't get temporary code using jwt"`)
            console.log(error)
            throw(error)
        })
    }

    public async exchangeCodeToJwt(temporaryCode: string): Promise<void> {
        return axios.get<Jwt>(
            this.url + "/sso/jwt",
            { 
                params: { code: temporaryCode } 
            }
        ).then(
            response => tokenStorage.updateTokens(response.data)
        ).catch((error: any) => {
            console.log(`Can't get JWT by temporary code`)
            console.log(error)
            throw(error)
        })
    }

    public async refreshToken(): Promise<void> {
        return axios.put<Jwt>(
            this.url + "/jwt",
            { refreshToken: tokenStorage.refreshToken }
        ).then(
            response => tokenStorage.updateTokens(response.data)
        ).catch((error: any) => {
            console.log(`Can't get JWT using refreshToken`)
            console.log(error.response.data)
            throw(error)
        })
    }

    public async deleteRefreshToken(): Promise<any> {
        return axios.delete(
            this.url + "/jwt",
            { headers: tokenStorage.header() }
        ).catch((error: any) => {
            console.log(`Can't revoke refresh token`)
            console.log(error.response.data)
            throw (error)
        }).finally(() => tokenStorage.clear())
    }

    public async createAccount(account: CreateAccountRequest): Promise<any> {
        return axios.post<any>(
            this.url + "/accounts", account
        ).then((response: any) => response.data)
    }
}