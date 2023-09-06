import { Jwt } from './sso-service'
import { TokenClaims } from './token-claims'


class TokenStorage {
    token?: string
    refreshToken?: string
    claims?: TokenClaims

    constructor() {
        this.token = localStorage.token
        this.refreshToken = localStorage.refreshToken
        this.claims = this.token
            ? TokenClaims.of(this.token)
            : null
    }

    public header(): object {
        if (!this.token) {
            throw new Error("Can't find a JWT token")
        }
        return {
            'Authorization': `Bearer ${this.token}`
        }
    }

    public defined() {
        return this.token != null
    }

    public clear(): void {
        console.log("clear tokens")
        this.token = undefined
        this.refreshToken = undefined
        this.claims = undefined
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
    }

    public updateTokens(jwt: Jwt): void {
        console.log("update tokens")
        this.token = jwt.token;
        this.refreshToken = jwt.refreshToken;
        this.claims = TokenClaims.of(this.token!)
        localStorage.setItem("token", this.token!)
        localStorage.setItem("refreshToken", this.refreshToken!)
    }
}

export const tokenStorage = new TokenStorage()
