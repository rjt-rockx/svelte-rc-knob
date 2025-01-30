<!--
@component
@name Knob
@description Root component that handles all user interactions for the knob control.
Provides context for child components and manages the knob's state.

State Management:
- Supports both controlled (via value prop) and uncontrolled (via initialValue prop) modes
- Internal state tracks value, percentage, and interaction status
- Syncs with external value changes in controlled mode

Context Provided:
- state: Current knob state (value, percentage, etc.)
- config: Static configuration (size, angles, steps)

Events:
- onChange: Called when value changes (after interaction)
- onInteractiveChange: Called during interaction
- onStart/onEnd: Called at interaction boundaries
-->
<script lang="ts">
	import { setContext } from 'svelte';
	import { createKnobState } from '../stores/knob.svelte';
	import { createKnobEventHandlers } from '../actions/events.js';
	import type { Snippet } from 'svelte';
	import type { InteractiveHook, KnobContext } from '../types.js';

	/**
	 * Props interface for the Knob component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Minimum value of the knob */
		min: number;
		/** Maximum value of the knob */
		max: number;
		/** Initial value when component mounts */
		initialValue?: number | null;
		/** Current value (for controlled components) */
		value?: number | null;
		/** Whether the knob can rotate multiple times */
		multiRotation?: boolean;
		/** Starting angle offset in degrees */
		angleOffset?: number;
		/** Total angle range in degrees */
		angleRange?: number;
		/** Size of the knob in pixels */
		size: number;
		/** Callback when value changes (after interaction ends) */
		onChange?: (value: number) => void;
		/** Callback during interaction */
		onInteractiveChange?: (value: number) => void;
		/** Hook to modify interaction behavior */
		interactiveHook?: InteractiveHook;
		/** Callback when interaction starts */
		onStart?: () => void;
		/** Callback when interaction ends */
		onEnd?: () => void;
		/** Number of discrete steps */
		steps?: number;
		/** Whether to snap to steps */
		snap?: boolean;
		/** Whether to trigger onChange during interaction */
		tracking?: boolean;
		/** Whether the knob is read-only */
		readOnly?: boolean;
		/** Whether to enable mouse wheel control */
		useMouseWheel?: boolean;
		/** ARIA value text */
		ariaValueText?: string;
		/** ARIA labelledby ID */
		ariaLabelledBy?: string;
		/** Additional CSS class */
		class?: string;
		/** SVG class */
		svgClass?: string;
		/** Child components */
		children?: Snippet;
	}

	let {
		min,
		max,
		value = $bindable(null),
		initialValue = value,
		multiRotation = false,
		angleOffset = 0,
		angleRange = 360,
		size,
		onChange = () => {},
		onInteractiveChange = () => {},
		interactiveHook,
		onStart = () => {},
		onEnd = () => {},
		steps,
		snap = false,
		tracking = true,
		readOnly = false,
		useMouseWheel = true,
		ariaValueText,
		ariaLabelledBy,
		class: className,
		svgClass,
		children
	}: Props = $props();

	console.info('[Knob] Initializing with props:', {
		min,
		max,
		value,
		initialValue,
		multiRotation,
		angleOffset,
		angleRange,
		size,
		steps,
		snap,
		tracking,
		readOnly,
		useMouseWheel,
		ariaValueText,
		ariaLabelledBy,
		class: className,
		svgClass
	});

	// Create knob state with internal reactivity
	const knobState = createKnobState({
		min,
		max,
		initialValue,
		multiRotation,
		angleOffset,
		angleRange,
		size,
		steps: snap ? steps : undefined,
		readOnly,
		tracking,
		useMouseWheel,
		onChange,
		onInteractiveChange,
		onStart,
		onEnd
	});

	// Create event handlers with state reference
	const { handleKeyDown, handleWheel, handleStart, handleMove, handleEnd, handleCancel } =
		createKnobEventHandlers(knobState, {
			readOnly,
			useMouseWheel,
			interactiveHook
		});

	// Make state available to child components through context
	console.debug('[Knob] Setting up context for child components');
	setContext<KnobContext>('knob', {
		state: knobState.state,
		config: {
			size,
			angleOffset,
			angleRange,
			steps
		}
	});

	// Sync external value with internal state
	$effect(() => {
		if (value !== null && value !== knobState.state.value) {
			knobState.state.value = value;
			knobState.state.percentage = (value - min) / (max - min);
		}
	});

	$effect(() => {
		// Log state changes for debugging
		console.debug('[Knob] State updated:', {
			value: knobState.state.value,
			percentage: knobState.state.percentage,
			isActive: knobState.state.isActive,
			mouseAngle: knobState.state.mouseAngle
		});
	});
</script>

<div
	role="slider"
	tabindex="0"
	class={className}
	style="outline: none; width: {size}px; height: {size}px"
	aria-valuemax={knobState.state.max}
	aria-valuemin={knobState.state.min}
	aria-valuenow={knobState.state.value}
	aria-valuetext={ariaValueText}
	aria-labelledby={ariaLabelledBy}
	onkeydown={handleKeyDown}
	onwheel={handleWheel}
	onpointerdown={handleStart}
	onpointermove={handleMove}
	onpointerup={handleEnd}
	onpointercancel={handleCancel}
>
	<svg width={size} height={size} overflow="visible" class={svgClass}>
		{@render children?.()}
	</svg>
</div>
