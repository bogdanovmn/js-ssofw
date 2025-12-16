import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { SsoService } from './sso-service'
import { tokenStorage } from './token-storage'

class UnauthenticatedError extends Error {}

export class AuthHttpClient {
  private ssoService: SsoService
  private onFailAction: Function
  private axiosInstance: AxiosInstance

  private refreshTokenPromise: Promise<void> | null = null

  constructor(apiBaseUrl: string, ssoService: SsoService, onFailFunction: Function = () => {}) {
    this.axiosInstance = axios.create({
      baseURL: apiBaseUrl
    })
    this.ssoService = ssoService
    this.onFailAction = onFailFunction
  }

  async makeRequest<ResponseType>(config: AxiosRequestConfig): Promise<ResponseType> {
    return this.httpRequest<ResponseType>(() => this.directHttpRequest<ResponseType>(config))
  }

  async get<ResponseType>(url: string, params = {}): Promise<ResponseType> {
    return this.makeRequest<ResponseType>({ method: 'GET', url, params })
  }

  async post<ResponseType>(url: string, data = {}): Promise<ResponseType> {
    return this.makeRequest<ResponseType>({ method: 'POST', url, data })
  }

  async put<ResponseType>(url: string, data = {}): Promise<ResponseType> {
    return this.makeRequest<ResponseType>({ method: 'PUT', url, data })
  }

  async delete<ResponseType>(url: string, params = {}): Promise<ResponseType> {
    return this.makeRequest<ResponseType>({ method: 'DELETE', url, params })
  }

  private async httpRequest<ResponseType>(
    requestFunction: () => Promise<ResponseType>
  ): Promise<ResponseType> {
    try {
      return await requestFunction()
    } catch (error: any) {
      if (!(error instanceof UnauthenticatedError)) {
        throw error
      }
      if (this.refreshTokenPromise) {
        await this.refreshTokenPromise
        return requestFunction()
      }
      this.refreshTokenPromise = this.ssoService.refreshToken()
        .then(() => {
          console.log('Token refreshed successfully')
        })
        .catch((refreshError) => {
          console.log('Failed to refresh token, clearing storage')
          tokenStorage.clear()
          if (this.onFailAction) {
            this.onFailAction()
          }
          throw refreshError
        })
        .finally(() => {
          this.refreshTokenPromise = null
        })

      await this.refreshTokenPromise

      return requestFunction()
    }
  }

  private async directHttpRequest<ResponseType>(config: AxiosRequestConfig): Promise<ResponseType> {
    try {
      const response = await this.axiosInstance<ResponseType>({
        ...config,
        headers: {
          ...config.headers,
          ...tokenStorage.header()
        }
      })
      return response.data
    } catch (error: any) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new UnauthenticatedError()
      }
      throw new Error(`Request error: ${this.errorResponseMessage(error)}`)
    }
  }

  private errorResponseMessage(error: any): string {
    if (axios.isAxiosError(error) && error.response?.data) {
      return typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data)
    }
    return 'An unexpected error occurred'
  }
}