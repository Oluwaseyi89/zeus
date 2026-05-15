// Crypto routines are mocked in this hackathon stub.

export const generateSecret = () => {
  const secret = Math.random().toString(36).substring(2, 15);
  return secret;
};

export const hashSecret = (secret: string) => {
  // Mock SHA256
  return '0x' + secret.split('').map(c => c.charCodeAt(0).toString(16)).join('');
};

export const encryptData = (data: string, key: string) => {
  return `encrypted_${data}`;
};
