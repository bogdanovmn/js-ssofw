import jwt_decode from "jwt-decode";

export enum Role {
    user = 'user', 
    moderator = 'moderator', 
    admin = 'admin'
}

export class TokenClaims {
    userName: string
    roles: string[]

    isAdmin(appName: string): boolean {
        return this.hasRole(Role.admin, appName)
    }

    isSuperAdmin(): boolean {
        return this.isAdmin('any')
    }

    hasRole(role: Role, appName: string) {
        return this.roles 
            && this.roles.some(r => r == `${appName}:${role}` || r == `any:${role}`)
    }

    static of(token: string): TokenClaims {
        return Object.assign(
            Object.create(TokenClaims.prototype), 
            jwt_decode(token)
        );
    }
}
