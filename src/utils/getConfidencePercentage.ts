/**
 * Converts a decimal (e.g., 0.756) to an integer percentage string (e.g., "76%").
 *
 * @param {number} decimal The decimal value to convert (0.0 to 1.0).
 * @returns {string} The formatted integer percentage string.
 */
export const getCondidenceValue = (decimal: number) => {
  let formattedPercentage = decimal;
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    formattedPercentage = Number(decimal);
  }

  // 1. Calculate the percentage and round to the nearest whole number (e.g., 0.756 -> 76)
  const integerPercentage = Math.round(formattedPercentage * 100);

  // 2. Convert to string and append the '%' symbol
  return `${integerPercentage}%`;
};
