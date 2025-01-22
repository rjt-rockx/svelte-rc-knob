import type { Callbacks, KnobState } from '../types.js';
import {
	calculatePositionFromMouseAngle,
	getValueFromPercentage,
	clamp,
	getPercentageFromValue,
	snapPosition
} from '../utils.js';

/**
 * Configuration interface for knob initialization
 */
interface KnobConfiguration extends Callbacks {
	min: number;
	max: number;
	multiRotation: boolean;
	initialValue?: number | null;
	angleOffset: number;
	angleRange: number;
	size: number;
	steps?: number;
	readOnly: boolean;
	tracking: boolean;
	useMouseWheel: boolean;
}

/**
 * Creates a reactive knob state with all necessary handlers for interaction
 * @param config - Configuration object for the knob
 * @returns Object containing state getters/setters and event handlers
 */
export function createKnobState({
	min,
	max,
	multiRotation,
	initialValue,
	angleOffset = 0,
	angleRange = 360,
	size,
	steps,
	onChange,
	onInteractiveChange,
	onStart,
	onEnd,
	tracking
}: KnobConfiguration) {
	console.info('[createKnobState] Initializing with config:', {
		min,
		max,
		multiRotation,
		initialValue,
		angleOffset,
		angleRange,
		size,
		steps,
		tracking
	});

	const internalState = $state<KnobState>({
		isActive: false,
		min,
		max,
		multiRotation,
		angleOffset,
		angleRange,
		mouseAngle: null,
		percentage: initialValue ? (initialValue - min) / (max - min) : 0,
		value: initialValue || 0,
		tracking,
		size,
		steps,
		startPercentage: null,
		startValue: null
	});

	/**
	 * Handles the start of user interaction with the knob
	 * @param mouseAngle - Current mouse angle in degrees
	 */
	function handleStart(mouseAngle: number) {
		console.debug('[handleStart] Starting interaction at angle:', mouseAngle);

		const position = calculatePositionFromMouseAngle({
			previousMouseAngle: null,
			previousPercentage: null,
			...internalState,
			mouseAngle,
			percentage: internalState.percentage as number
		});

		const position2 = snapPosition(position, internalState, steps);
		const value = getValueFromPercentage({ ...internalState, ...position2 });

		console.debug('[handleStart] Calculated position:', {
			position,
			position2,
			value
		});

		internalState.isActive = true;
		internalState.mouseAngle = mouseAngle;
		internalState.percentage = position2.percentage;
		internalState.startPercentage = internalState.percentage;
		internalState.startValue = internalState.value;
		internalState.value = value;

		onStart?.();
		onInteractiveChange?.(value);
		if (internalState.tracking) {
			onChange?.(value);
		}
	}

	/**
	 * Handles continuous movement during knob interaction
	 * @param mouseAngle - Current mouse angle in degrees
	 */
	function handleMove(mouseAngle: number) {
		if (!internalState.isActive) {
			console.debug('[handleMove] Ignoring move - knob not active');
			return;
		}

		console.debug('[handleMove] Processing movement at angle:', mouseAngle);

		const position = calculatePositionFromMouseAngle({
			previousMouseAngle: internalState.mouseAngle,
			previousPercentage: internalState.percentage,
			...internalState,
			mouseAngle,
			percentage: internalState.percentage as number
		});

		const position2 = snapPosition(position, internalState, steps);
		const value = getValueFromPercentage({ ...internalState, ...position2 });

		console.debug('[handleMove] Calculated position:', {
			position,
			position2,
			value
		});

		internalState.mouseAngle = mouseAngle;
		internalState.percentage = position2.percentage;
		internalState.value = value;

		onInteractiveChange?.(value);
		if (internalState.tracking) {
			onChange?.(value);
		}
	}

	/**
	 * Handles the end of knob interaction
	 */
	function handleEnd() {
		console.debug('[handleEnd] Ending interaction, current state:', {
			value: internalState.value,
			tracking: internalState.tracking
		});

		if (internalState.value !== null && !internalState.tracking) {
			onChange?.(internalState.value);
		}

		internalState.isActive = false;
		internalState.startPercentage = null;
		internalState.startValue = null;

		onEnd?.();
	}

	/**
	 * Handles cancellation of knob interaction
	 */
	function handleCancel() {
		console.debug('[handleCancel] Cancelling interaction, reverting to:', {
			startValue: internalState.startValue,
			startPercentage: internalState.startPercentage
		});

		if (internalState.startValue !== null) {
			internalState.value = internalState.startValue;
			internalState.percentage = internalState.startPercentage;

			if (internalState.tracking) {
				onChange?.(internalState.startValue);
			}
		}

		internalState.isActive = false;
		internalState.startPercentage = null;
		internalState.startValue = null;

		onEnd?.();
	}

	/**
	 * Handles step-wise value changes (e.g. from keyboard)
	 * @param direction - Direction of change (1 or -1)
	 */
	function handleStep(direction: number) {
		if (internalState.value === null) {
			console.debug('[handleStep] Ignoring step - no current value');
			return;
		}

		console.debug('[handleStep] Processing step:', {
			direction,
			currentValue: internalState.value,
			min: internalState.min,
			max: internalState.max
		});

		const value = clamp(internalState.min, internalState.max, internalState.value + direction);
		const percentage = getPercentageFromValue({ ...internalState, value });

		console.debug('[handleStep] New state:', {
			value,
			percentage
		});

		internalState.value = value;
		internalState.percentage = percentage;

		onInteractiveChange?.(value);
		onChange?.(value);
	}

	return {
		state: internalState,
		handleStart,
		handleMove,
		handleEnd,
		handleCancel,
		handleStep
	};
}
