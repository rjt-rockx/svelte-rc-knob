/**
 * Angle calculation utilities for knob positioning
 */

import { clamp } from './math.js';

/**
 * Position interface representing the state of a knob interaction
 */
export interface Position {
	updated: boolean;
	mouseAngle: number;
	percentage: number;
}

/**
 * Calculates the percentage (0-1) based on mouse angle relative to knob configuration
 */
export const calculatePercentageFromMouseAngle = ({
	mouseAngle,
	angleOffset,
	angleRange
}: {
	mouseAngle: number;
	angleOffset: number;
	angleRange: number;
}) => {
	console.debug('[calculatePercentageFromMouseAngle] Input:', {
		mouseAngle,
		angleOffset,
		angleRange
	});
	const rangle = ((mouseAngle - (angleOffset + angleRange * 0.5) + 900) % 360) - 180;
	const percentage = 0.5 + rangle / angleRange;
	const result = clamp(0, 1, percentage);
	console.debug('[calculatePercentageFromMouseAngle] Result:', result);
	return result;
};

/**
 * Calculates the new position based on mouse angle and previous state
 */
export const calculatePositionFromMouseAngle = ({
	mouseAngle,
	multiRotation,
	angleOffset,
	angleRange,
	percentage,
	previousPercentage,
	previousMouseAngle
}: {
	mouseAngle: number;
	multiRotation?: boolean;
	angleOffset: number;
	angleRange: number;
	percentage: number;
	previousPercentage: number | null;
	previousMouseAngle: number | null;
}): Position => {
	console.debug('[calculatePositionFromMouseAngle] Input:', {
		mouseAngle,
		multiRotation,
		angleOffset,
		angleRange,
		percentage,
		previousPercentage,
		previousMouseAngle
	});

	if (previousMouseAngle === null || previousPercentage === null) {
		const newPercentage = calculatePercentageFromMouseAngle({
			mouseAngle,
			angleOffset,
			angleRange
		});
		console.debug('[calculatePositionFromMouseAngle] Initial position:', {
			mouseAngle,
			percentage: newPercentage
		});
		return {
			updated: true,
			mouseAngle,
			percentage: newPercentage
		};
	}

	if (!multiRotation) {
		const newPercentage = calculatePercentageFromMouseAngle({
			mouseAngle,
			angleOffset,
			angleRange
		});
		console.debug('[calculatePositionFromMouseAngle] Single rotation position:', {
			mouseAngle,
			percentage: newPercentage
		});
		return {
			updated: true,
			mouseAngle,
			percentage: newPercentage
		};
	}

	const mouseDiff = mouseAngle - previousMouseAngle;
	if (Math.abs(mouseDiff) > 180) {
		console.debug('[calculatePositionFromMouseAngle] No update - large angle change');
		return {
			updated: false,
			mouseAngle: previousMouseAngle,
			percentage: previousPercentage
		};
	}

	const newPercentage = clamp(0, 1, percentage + mouseDiff / angleRange);
	console.debug('[calculatePositionFromMouseAngle] Multi rotation position:', {
		mouseAngle,
		percentage: newPercentage,
		mouseDiff
	});
	return {
		updated: true,
		mouseAngle,
		percentage: newPercentage
	};
};

/**
 * Snaps a position to the nearest step based on state configuration
 */
export const snapPosition = (
	position: Position,
	state: { angleOffset: number; angleRange: number },
	steps?: number
): Position => {
	if (!steps || !position.updated) {
		return position;
	}

	const nbIntervals = steps - 1;
	const snappedPercentage = Math.round(position.percentage * nbIntervals) / nbIntervals;

	console.debug('[snapPosition]', {
		position,
		steps,
		snappedPercentage
	});

	return {
		...position,
		percentage: snappedPercentage
	};
};
