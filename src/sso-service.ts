import axios from "axios";
import { tokenStorage } from "./token-storage";

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

    public async refreshToken(): Promise<void> {
        return axios.put<Jwt>(
            this.url + "/jwt",
            { refreshToken: tokenStorage.getRefreshToken() }
        ).then(
            response => tokenStorage.updateTokens(response.data)
        ).catch((error: any) => {
            console.log(`Can't get JWT using refreshToken`)
            console.log(error.response.data)
            throw(error)
        })
    }

    public async deleteRefreshToken(): Promise<void> {
        return axios.delete(
            this.url + "/jwt",
            { headers: tokenStorage.header() }
        ).then(
            () => tokenStorage.clear()
        ).catch((error: any) => {
            console.log(`Can't revoke refresh token`)
            console.log(error.response.data)
            throw (error)
        })
    }

    public async createAccount(account: CreateAccountRequest): Promise<any> {
        return axios.post<any>(
            this.url + "/accounts", account
        ).then((response: any) => response.data)
    }
}