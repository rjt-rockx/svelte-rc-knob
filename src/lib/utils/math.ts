/**
 * Math utilities for value calculations and clamping
 */

/**
 * Clamps a value between a minimum and maximum value
 */
export const clamp = (min: number, max: number, value: number) => {
	const result = Math.max(min, Math.min(max, value));
	console.debug('[clamp]', { min, max, value, result });
	return result;
};

/**
 * Snaps a percentage to the nearest step in a given number of intervals
 */
export const snapPercentage = (percentage: number, nbIntervals: number) => {
	const result = Math.round(percentage * nbIntervals) / nbIntervals;
	console.debug('[snapPercentage]', { percentage, nbIntervals, result });
	return result;
};

/**
 * Converts a percentage to a value within a range
 */
export const getValueFromPercentage = ({
	min,
	max,
	percentage
}: {
	min: number;
	max: number;
	percentage: number;
}) => {
	const result = min + (max - min) * percentage;
	console.debug('[getValueFromPercentage]', { min, max, percentage, result });
	return result;
};

/**
 * Converts a value to a percentage within a range
 */
export const getPercentageFromValue = ({
	min,
	max,
	value
}: {
	min: number;
	max: number;
	value: number;
}) => {
	const result = (value - min) / (max - min);
	console.debug('[getPercentageFromValue]', { min, max, value, result });
	return result;
};
