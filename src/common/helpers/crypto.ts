import * as crypto from 'crypto';

export const hash = (
  data: string,
  algorithm = 'sha512',
  options?: crypto.HashOptions,
) => {
  try {
    const hash = crypto.createHash(algorithm, options);
    const sha = hash.update(data, 'utf-8');
    return sha.digest('hex');
  } catch (error) {
    console.log(error);
  }

  return '';
};
