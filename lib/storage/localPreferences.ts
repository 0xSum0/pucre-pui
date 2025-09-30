// lib/storage/localPreferences.ts

const LocalPreferences = {
    getUserToken: (): string | null => {
        return localStorage.getItem('userToken');
    },

    setUserToken: (token: string): void => {
        localStorage.setItem('userToken', token);
    },

    getFirebaseToken: (): string | null => {
        return localStorage.getItem('firebaseToken');
    },

    setFirebaseToken: (token: string): void => {
        localStorage.setItem('firebaseToken', token);
    },

    clearAll: (): void => {
        localStorage.clear();
    },
};

export default LocalPreferences;  