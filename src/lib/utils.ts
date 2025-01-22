/**
 * Position interface representing the state of a knob interaction
 */
interface Position {
	updated: boolean;
	mouseAngle: number;
	percentage: number;
}

/**
 * Clamps a value between a minimum and maximum value
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param value - Value to clamp
 * @returns Clamped value
 */
export const clamp = (min: number, max: number, value: number) => {
	const result = Math.max(min, Math.min(max, value));
	console.debug('[clamp]', { min, max, value, result });
	return result;
};

/**
 * Calculates the percentage (0-1) based on mouse angle relative to knob configuration
 * @param params - Object containing mouseAngle, angleOffset, and angleRange
 * @returns Percentage value between 0 and 1
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
 * Handles both single rotation and multi-rotation modes
 * @param params - Object containing current and previous state parameters
 * @returns Position object with updated state
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

	if (previousMouseAngle !== null) {
		// normalize and cancel the interaction if the delta angle is too big
		const deltaAngle = (mouseAngle - previousMouseAngle) % 360;
		const validDeltaAngle =
			deltaAngle > 180 ? -(360 - deltaAngle) : deltaAngle < -180 ? 360 + deltaAngle : deltaAngle;

		console.debug('[calculatePositionFromMouseAngle] Delta angles:', {
			deltaAngle,
			validDeltaAngle
		});

		if (validDeltaAngle >= 120 || validDeltaAngle <= -120) {
			console.debug('[calculatePositionFromMouseAngle] Delta too large, cancelling update');
			return {
				updated: false,
				mouseAngle: previousMouseAngle,
				percentage: previousPercentage!
			};
		}

		// clamp the percentage
		const newPercentage = previousPercentage! + validDeltaAngle / angleRange;
		if (!multiRotation && (newPercentage < 0 || newPercentage > 1)) {
			const clampedPercentage = newPercentage < 0 ? 0 : 1;
			const theoricalMouseAngle =
				newPercentage < 0 ? angleOffset : (angleOffset + angleRange + 720) % 360;

			console.debug('[calculatePositionFromMouseAngle] Clamping percentage:', {
				newPercentage,
				clampedPercentage,
				theoricalMouseAngle
			});

			return {
				updated: true,
				mouseAngle: theoricalMouseAngle,
				percentage: clampedPercentage
			};
		}

		console.debug('[calculatePositionFromMouseAngle] New position:', {
			mouseAngle,
			percentage: newPercentage
		});

		return {
			updated: true,
			mouseAngle,
			percentage: newPercentage
		};
	} else {
		if (multiRotation) {
			const rawPercentage = calculatePercentageFromMouseAngle({
				angleOffset,
				angleRange,
				mouseAngle
			});
			const deltaPercent = (rawPercentage + 1 - (percentage % 1)) % 1;
			const validDeltaPercent = deltaPercent > 0.5 ? deltaPercent - 1 : deltaPercent;

			console.debug('[calculatePositionFromMouseAngle] Multi-rotation:', {
				rawPercentage,
				deltaPercent,
				validDeltaPercent
			});

			return {
				updated: true,
				mouseAngle,
				percentage: percentage + validDeltaPercent
			};
		} else {
			const newPercentage = calculatePercentageFromMouseAngle({
				angleOffset,
				angleRange,
				mouseAngle
			});

			console.debug('[calculatePositionFromMouseAngle] Single rotation:', { newPercentage });

			return {
				updated: true,
				mouseAngle,
				percentage: newPercentage
			};
		}
	}
};

/**
 * Snaps a position to the nearest step if steps are defined
 * @param position - Current position
 * @param state - Knob state containing angle configuration
 * @param steps - Number of steps to snap to
 * @returns Updated position snapped to nearest step
 */
export const snapPosition = (
	position: Position,
	state: { angleOffset: number; angleRange: number },
	steps?: number
): Position => {
	console.debug('[snapPosition] Input:', { position, state, steps });

	if (!position.updated || !steps) {
		return position;
	}

	const percentage = snapPercentage(position.percentage, steps);
	const mouseAngle = (state.angleOffset + state.angleRange * percentage) % 360;
	const result = {
		...position,
		percentage,
		mouseAngle: mouseAngle < 0 ? mouseAngle + 360 : mouseAngle
	};

	console.debug('[snapPosition] Result:', result);
	return result;
};

/**
 * Snaps a percentage value to the nearest interval
 * @param percentage - Current percentage value
 * @param nbIntervals - Number of intervals to snap to
 * @returns Snapped percentage value
 */
export const snapPercentage = (percentage: number, nbIntervals: number) => {
	console.debug('[snapPercentage] Input:', { percentage, nbIntervals });

	if (percentage === 0) return 0;
	const sign = Math.sign(percentage);
	const p = Math.abs(percentage);
	const stepSize = 1 / nbIntervals;
	const extra = (p + stepSize * 0.5) % stepSize;
	const result = sign * (p - stepSize * 0.5) + sign * (stepSize - extra);

	console.debug('[snapPercentage] Result:', result);
	return result;
};

/**
 * Converts a percentage to an actual value based on min/max range
 * @param params - Object containing min, max, and percentage
 * @returns Calculated value
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
 * Converts a value to a percentage based on min/max range
 * @param params - Object containing min, max, and value
 * @returns Calculated percentage
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
