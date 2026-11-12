// Authentication & Session Helper for RedThread

const USER_KEY = 'redthread_user';

export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  return getUser() !== null;
};

