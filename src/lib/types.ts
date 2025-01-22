/**
 * Internal state interface for the knob component
 */
export interface KnobState {
	isActive: boolean;
	min: number;
	max: number;
	value: number | null;
	percentage: number | null;
	mouseAngle: number | null;
	startPercentage: number | null;
	startValue: number | null;
	multiRotation: boolean;
	angleOffset: number;
	angleRange: number;
	tracking: boolean;
	size: number;
	steps?: number;
}

export interface Action {
	type: string;
	direction?: number;
	steps?: number;
}

export interface Callbacks {
	onChange: (value: number) => void;
	onInteractiveChange: (value: number) => void;
	onStart: () => void;
	onEnd: () => void;
	interactiveHook?: InteractiveHook;
}

export interface InteractiveHookResult {
	readOnly?: boolean;
	steps?: number;
}

export interface InteractiveHookEvent {
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	mouseX: number;
	mouseY: number;
	mouseRadius: number;
	mouseAngle: number;
}

export type InteractiveHook = (event: InteractiveHookEvent) => InteractiveHookResult;

/**
 * Context provided to child components
 */
export interface KnobContext {
	state: KnobState;
	config: {
		size: number;
		angleOffset: number;
		angleRange: number;
		steps?: number;
	};
}
