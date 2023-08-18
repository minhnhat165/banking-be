export const generateNumber = (numDigit: number): string => {
  let number = '';
  for (let i = 0; i < numDigit; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
};
