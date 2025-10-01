// lib/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import LocalPreferences from "./storage/localPreferences";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://panda.pucre.xyz/api/v1";

class ApiClient {
  private static _axios: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 60000,
  });

  // Generate dynamic headers
  private static async getHeaders(): Promise<Record<string, string>> {
    // Try-catch in case these values are not available in browser
    let os = "web";
    let osVersion = "unknown";
    let deviceModel = "unknown";
    let language = navigator.language || "en";
    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let uuid = localStorage.getItem("deviceUUID") || "browser-uuid";

    const userToken = LocalPreferences.getUserToken() || "";
    const firebaseToken = LocalPreferences.getFirebaseToken() || "";

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Pucre-Token": userToken,
      "X-Pucre-App-Id": "",
      "X-Pucre-App-Version": "1.0.0",
      "X-Pucre-App-Version-Code": "0",
      "X-Pucre-Os": os,
      "X-Pucre-Os-Version": osVersion,
      "X-Pucre-Model": deviceModel,
      "X-Pucre-Uuid": uuid,
      "X-Pucre-Device-Uuid": uuid,
      "X-Pucre-Language": language,
      "X-Pucre-Timezone": timezone,
      Authorization: `Bearer ${firebaseToken}`,
    };
  }

  static async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const headers = await this.getHeaders();
    return this._axios.get<T>(endpoint, {
      params,
      headers,
    });
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<AxiosResponse<T>> {
    const headers = await this.getHeaders();
    return this._axios.post<T>(endpoint, data, {
      headers,
    });
  }

  static async put<T = any>(endpoint: string, data: any): Promise<AxiosResponse<T>> {
    const headers = await this.getHeaders();
    return this._axios.put<T>(endpoint, data, {
      headers,
    });
  }

  static async patch<T = any>(endpoint: string, data: any): Promise<AxiosResponse<T>> {
    const headers = await this.getHeaders();
    return this._axios.patch<T>(endpoint, data, {
      headers,
    });
  }

  static async delete<T = any>(endpoint: string): Promise<AxiosResponse<T>> {
    const headers = await this.getHeaders();
    return this._axios.delete<T>(endpoint, {
      headers,
    });
  }

  static async upload<T = any>(
    endpoint: string,
    fields: Record<string, any>,
    file: File
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, fields[key]);
    }
    formData.append("profile_image", file, "profile.png");

    const headers = await this.getHeaders();
    return this._axios.post<T>(endpoint, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

export default ApiClient;
