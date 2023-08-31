import jwt_decode from "jwt-decode";
import { Jwt } from './sso-service'

type TokenData = {
    userName: string;
}

class TokenStorage {
    private token?: string
    private refreshToken?: string

    constructor() {
        this.token = localStorage.token
        this.refreshToken = localStorage.refreshToken
    }

    public header(): object {
        if (!this.token) {
            throw new Error("Can't find a JWT token")
        }
        return {
            'Authorization': `Bearer ${this.token}`
        }
    }

    public userName(): string | null {
        return this.defined()
            ? jwt_decode<TokenData>(this.token!).userName
            : null
    }

    public getRefreshToken(): string {
        return this.refreshToken!
    }
    public defined() {
        return this.token != null
    }

    public clear(): void {
        console.log("clear tokens")
        this.token = undefined
        this.refreshToken = undefined
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
    }

    public updateTokens(jwt: Jwt): void {
        console.log("update tokens")
        this.token = jwt.token;
        this.refreshToken = jwt.refreshToken;
        localStorage.setItem("token", this.token!)
        localStorage.setItem("refreshToken", this.refreshToken!)
    }
}

export const tokenStorage = new TokenStorage()
