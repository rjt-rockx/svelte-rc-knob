<!--
@component
@name Pointer
@description Visual indicator component that shows the current value of the knob.
Supports different shapes (rect, circle, triangle) and custom SVG elements.

Shape Types:
- rect: Rectangular pointer centered on rotation point
- circle: Circular pointer with radius equal to width
- triangle: Triangular pointer pointing outward
- custom: Custom SVG content via children prop

Positioning:
- useRotation=true: Rotates pointer around center point
- useRotation=false: Positions pointer at calculated x,y coordinates
- radius determines distance from center
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import type { KnobContext } from '../types.js';

	/**
	 * Props passed to custom pointer snippets
	 */
	type SnippetProps = {
		width: number;
		height: number;
		percentage: number;
	};

	/**
	 * Props interface for the Pointer component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Width of the pointer */
		width: number;
		/** Height of the pointer (defaults to width) */
		height?: number;
		/** Whether to use rotation transform (true) or position transform (false) */
		useRotation?: boolean;
		/** Shape type: 'rect', 'circle', or 'triangle' */
		type?: string;
		/** Fill color of the pointer */
		color?: string;
		/** Distance from center to pointer */
		radius?: number;
		/** Center point of rotation */
		center?: number;
		/** Additional CSS class */
		class?: string;
		/** Custom SVG element to use as pointer */
		children?: Snippet<[SnippetProps]>;
		/** Percentage value to display */
		percentage?: number;
	}

	const props: Props = $props();

	console.debug('[Pointer] Initializing with props:', props);

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Pointer] No knob context found - component must be a child of Knob');
	}

	const { angleOffset, angleRange, size } = knobContext.config;
	const percentage = $derived(props.percentage ?? knobContext.state.percentage);

	const {
		children,
		width,
		useRotation = true,
		radius = size / 2,
		center = size / 2,
		type,
		color = 'currentColor',
		class: className = ''
	} = $derived(props);

	const height = $derived(props.height ?? width);

	$effect(() => {
		console.debug('[Pointer] Computed dimensions:', {
			width,
			height,
			radius,
			center
		});
	});

	/**
	 * Calculates the transform string for positioning the pointer
	 * Uses either rotation or direct position calculation based on useRotation prop
	 */
	const transform = $derived.by(() => {
		if (percentage === null) {
			console.debug('[Pointer] No percentage available, skipping transform');
			return '';
		}

		let result = '';
		if (useRotation) {
			const rotation = angleOffset + angleRange * percentage;
			result = `rotate(${rotation} ${center} ${center})
				translate(${center} ${center - radius - height})`;
			console.debug('[Pointer] Rotation transform:', { rotation, center, radius, height });
		} else {
			const angle = ((angleOffset + angleRange * percentage - 90) * Math.PI) / 180;
			const x = center + radius * Math.cos(angle);
			const y = center + radius * Math.sin(angle);
			result = `translate(${x} ${y})`;
			console.debug('[Pointer] Position transform:', { angle, x, y });
		}
		return result;
	});

	$effect(() => {
		// Log pointer updates for debugging
		console.debug('[Pointer] State updated:', {
			percentage,
			transform
		});
	});
</script>

{#if percentage !== null}
	<g {transform}>
		{@render children?.({ width: width ?? 0, height: height ?? 0, percentage })}
		{#if type === 'rect'}
			<rect x={-width * 0.5} {width} {height} fill={color} class={className} />
		{:else if type === 'circle'}
			<circle r={width} fill={color} class={className} />
		{:else if type === 'triangle'}
			<path
				d={`M 0,0 L ${width / 2},${height} L ${-width / 2},${height} z`}
				fill={color}
				class={className}
			/>
		{/if}
	</g>
{/if}
