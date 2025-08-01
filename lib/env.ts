// Environment detection utilities
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};