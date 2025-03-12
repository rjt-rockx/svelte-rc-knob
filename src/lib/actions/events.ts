import type { InteractiveHook, InteractiveHookResult } from '../types.js';

/**
 * Mouse position interface representing both cartesian and polar coordinates
 * relative to the knob's center
 */
interface MousePosition {
	mouseX: number;
	mouseY: number;
	mouseRadius: number;
	mouseAngle: number;
}

/**
 * Mapping of keyboard arrow keys to their corresponding direction values
 */
const DIRECTIONS: Record<string, number> = {
	ArrowLeft: -1,
	ArrowUp: 1,
	ArrowRight: 1,
	ArrowDown: -1
};

/**
 * Gets the center coordinates of an element relative to the client viewport
 * @param elem - The HTML element to get the center coordinates for
 * @returns Object containing centerX and centerY coordinates
 */
const getClientCenter = (elem: HTMLElement) => {
	console.debug('[getClientCenter] Getting center for element', elem);
	const rect = elem.getBoundingClientRect();
	const center = {
		centerX: rect.x + elem.clientWidth / 2,
		centerY: rect.y + elem.clientHeight / 2
	};
	console.debug('[getClientCenter] Calculated center:', center);
	return center;
};

/**
 * Compute mouse position relative to the elem center
 * and converts it to polar coordinates with angle in degrees
 * @param elem - The HTML element to calculate position relative to
 * @param e - The mouse or pointer event
 * @returns MousePosition object with cartesian and polar coordinates
 */
const getMousePosition = (elem: HTMLElement, e: PointerEvent | MouseEvent): MousePosition => {
	console.debug('[getMousePosition] Processing event:', e.type);
	const { centerX, centerY } = getClientCenter(elem);

	const mouseX = e.clientX - centerX;
	const mouseY = e.clientY - centerY;
	const degree = (Math.atan2(mouseY, mouseX) * 180) / Math.PI + 90;
	const mouseAngle = degree < 0 ? degree + 360 : degree;
	const mouseRadius = Math.sqrt(mouseX * mouseX + mouseY * mouseY);

	const position = {
		mouseX,
		mouseY,
		mouseRadius,
		mouseAngle
	};
	console.debug('[getMousePosition] Calculated position:', position);
	return position;
};

/**
 * Creates event handlers for knob interactions including mouse, keyboard, and wheel events
 * @param knobState - Object containing state management functions for the knob
 * @param config - Configuration object for knob behavior
 * @returns Object containing all event handler functions
 */
export function createKnobEventHandlers(
	knobState: {
		handleStart: (mouseAngle: number) => void;
		handleMove: (mouseAngle: number) => void;
		handleEnd: () => void;
		handleCancel: () => void;
		handleStep: (direction: number) => void;
	},
	config: {
		readOnly: boolean;
		useMouseWheel: boolean;
		interactiveHook?: InteractiveHook;
	}
) {
	console.info('[createKnobEventHandlers] Creating event handlers with config:', config);

	/**
	 * Handles keyboard arrow key events for knob control
	 */
	const handleKeyDown = (e: KeyboardEvent) => {
		console.debug('[handleKeyDown] Key pressed:', {
			key: e.key,
			target: e.target,
			currentTarget: e.currentTarget,
			readOnly: config.readOnly
		});
		const direction = DIRECTIONS[e.key];
		if (!direction) {
			console.debug('[handleKeyDown] No direction for key:', e.key);
			return;
		}
		if (config.readOnly) {
			console.debug('[handleKeyDown] Ignoring keydown - knob is readonly');
			return;
		}

		e.preventDefault();
		console.debug('[handleKeyDown] Processing step with direction:', direction);
		knobState.handleStep(direction);
	};

	/**
	 * Handles mouse wheel events for knob control
	 */
	const handleWheel = (e: WheelEvent) => {
		console.debug('[handleWheel] Wheel event:', { deltaX: e.deltaX, deltaY: e.deltaY });
		if (!config.useMouseWheel) return;

		const direction = e.deltaX < 0 || e.deltaY > 0 ? 1 : e.deltaX > 0 || e.deltaY < 0 ? -1 : 0;
		if (!direction) return;

		e.preventDefault();
		console.debug('[handleWheel] Processing step with direction:', direction);
		knobState.handleStep(direction);
	};

	/**
	 * Gets interactive configuration from the hook if provided
	 */
	const getInteractiveConfig = (
		mousePosition: MousePosition,
		e: PointerEvent | MouseEvent
	): InteractiveHookResult => {
		if (!config.interactiveHook) return {};

		const result = config.interactiveHook({
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			metaKey: e.metaKey,
			shiftKey: e.shiftKey,
			...mousePosition
		});
		console.debug('[getInteractiveConfig] Hook result:', result);
		return result;
	};

	/**
	 * Handles the start of a knob interaction
	 */
	const handleStart = (e: PointerEvent | MouseEvent) => {
		console.debug('[handleStart] Starting interaction:', e.type);
		if ((e as PointerEvent).pointerType === 'mouse' && e.button !== 0) return;

		if (config.readOnly) {
			console.debug('[handleStart] Ignoring start - knob is readonly');
			return;
		}

		const target = e.currentTarget as HTMLElement;
		const mousePosition = getMousePosition(target, e);
		const userConfig = getInteractiveConfig(mousePosition, e);
		if (userConfig.readOnly) {
			console.debug('[handleStart] Ignoring start - interactive hook returned readonly');
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		// Setup global event tracking
		if (window.PointerEvent) {
			// Use pointer capture if available
			const pointerEvent = e as PointerEvent;
			target.setPointerCapture(pointerEvent.pointerId);
			target.addEventListener('pointermove', handleMove);
			target.addEventListener('pointerup', handleEnd);
			target.addEventListener('pointercancel', handleCancel);
		} else {
			// Fallback to window event listeners for mouse events
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleEnd);
		}

		// Prevent context menu during drag
		target.addEventListener('contextmenu', handleContextMenu);

		console.debug('[handleStart] Processing start with angle:', mousePosition.mouseAngle);
		knobState.handleStart(mousePosition.mouseAngle);
	};

	/**
	 * Handles the movement during a knob interaction
	 */
	const handleMove = (e: PointerEvent | MouseEvent) => {
		console.debug('[handleMove] Moving:', e.type);
		if (config.readOnly) {
			console.debug('[handleMove] Ignoring move - knob is readonly');
			return;
		}

		const mousePosition = getMousePosition(e.currentTarget as HTMLElement, e);
		const userConfig = getInteractiveConfig(mousePosition, e);
		if (userConfig.readOnly) {
			console.debug('[handleMove] Ignoring move - interactive hook returned readonly');
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		console.debug('[handleMove] Processing move with angle:', mousePosition.mouseAngle);
		knobState.handleMove(mousePosition.mouseAngle);
	};

	/**
	 * Handles the end of a knob interaction
	 */
	const handleEnd = (e?: PointerEvent | MouseEvent) => {
		console.debug('[handleEnd] Ending interaction');

		if (e) {
			const target = e.currentTarget as HTMLElement;
			cleanupEventListeners(target, e);
		}

		knobState.handleEnd();
	};

	/**
	 * Handles the cancellation of a knob interaction
	 */
	const handleCancel = (e?: PointerEvent | MouseEvent) => {
		console.debug('[handleCancel] Cancelling interaction');

		if (e) {
			const target = e.currentTarget as HTMLElement;
			cleanupEventListeners(target, e);
		}

		knobState.handleCancel();
	};

	/**
	 * Prevents context menu from showing during drag
	 */
	const handleContextMenu = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();

		const target = e.currentTarget as HTMLElement;
		cleanupEventListeners(target);

		knobState.handleCancel();
		return false;
	};

	/**
	 * Cleans up all event listeners
	 */
	const cleanupEventListeners = (target: HTMLElement, e?: PointerEvent | MouseEvent) => {
		if (window.PointerEvent && e) {
			const pointerEvent = e as PointerEvent;
			target.releasePointerCapture(pointerEvent.pointerId);
			target.removeEventListener('pointermove', handleMove);
			target.removeEventListener('pointerup', handleEnd);
			target.removeEventListener('pointercancel', handleCancel);
		} else {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
		}

		target.removeEventListener('contextmenu', handleContextMenu);
	};

	return {
		handleKeyDown,
		handleWheel,
		handleStart,
		handleMove,
		handleEnd,
		handleCancel
	};
}
