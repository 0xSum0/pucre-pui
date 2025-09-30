// lib/api/authApi.ts
import ApiClient from '../apiClient';

export type SignInResponse = {
  token: string;
  is_done_sign_in: boolean;
};

const AuthApi = {
  AppleSignIn: async ({
    uid,
    email,
    screenName,
  }: {
    uid: string;
    email: string;
    screenName: string;
  }): Promise<SignInResponse> => {
    try {
      const response = await ApiClient.post('/apple_signin', {
        uid,
        email,
        screen_name: screenName,
      });

      if (response.status === 200 && response.data.status === 200) {
        return response.data.data as SignInResponse;
      } else {
        throw new Error(`🚨 Phone Number Sign-In failed: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      throw new Error(`Phone Number Sign-In Error: ${error.message}`);
    }
  },

  phoneNumberSignIn: async ({
    uid,
    email,
    screenName,
  }: {
    uid: string;
    email: string;
    screenName: string;
  }): Promise<SignInResponse> => {
    try {
      const response = await ApiClient.post('/phone_number_signin', {
        uid,
        email,
        screen_name: screenName,
      });

      if (response.status === 200 && response.data.status === 200) {
        return response.data.data as SignInResponse;
      } else {
        throw new Error(`🚨 Phone Number Sign-In failed: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      throw new Error(`Phone Number Sign-In Error: ${error.message}`);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await ApiClient.post('/logout', {});
    } catch (e) {
      // Silent fail
    }
    localStorage.clear();
  },

  delete: async (): Promise<void> => {
    try {
      await ApiClient.post('/me/delete', {});
    } catch (e) {
      // Silent fail
    }
    localStorage.clear();
  },
};

export default AuthApi;