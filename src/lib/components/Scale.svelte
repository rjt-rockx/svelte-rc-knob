<!--
@component
@name Scale
@description Renders a radial scale with configurable tick marks around the knob.
Supports circle and rect tick shapes, or custom rendered ticks.

Rendering Modes:
- rect: Rectangular ticks with configurable width/height
- circle: Circular ticks with radius equal to width
- custom: Custom SVG content via snippet prop

Tick Positioning:
- Ticks are evenly distributed around the circle based on steps
- Each tick can be styled differently based on active state
- Active tick is determined by current percentage value
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { KnobContext } from '../types.js';
	import type { Snippet } from 'svelte';

	/**
	 * Base props for rendering scale ticks
	 */
	interface RenderProps {
		/** X translation for positioning */
		translateX: number;
		/** Y translation for positioning */
		translateY: number;
		/** Starting angle offset */
		angleOffset: number;
		/** Size of each step in degrees */
		stepSize: number;
		/** Center point of the scale */
		center: number;
		/** Default tick color */
		color: string;
		/** Default tick class */
		className?: string;
		/** Index of active tick */
		active: number;
		/** Color for active tick */
		activeColor: string;
		/** Class for active tick */
		activeClassName: string;
	}

	/**
	 * Extended props for custom tick rendering
	 */
	interface RenderCustomProps extends RenderProps {
		/** Current tick index */
		i: number;
		/** Width of tick */
		tickWidth: number;
		/** Height of tick */
		tickHeight: number;
		/** Total number of steps */
		steps: number;
		/** Current percentage value */
		percentage: number;
	}

	/**
	 * Props interface for the Scale component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Total angle range in degrees */
		angleRange?: number;
		/** Number of steps/ticks to render */
		steps?: number;
		/** Shape of ticks: 'rect' or 'circle' */
		type?: string;
		/** Distance from center to ticks */
		radius?: number;
		/** Width of each tick */
		tickWidth: number;
		/** Height of each tick (for rect type) */
		tickHeight: number;
		/** Default tick color */
		color?: string;
		/** Color for active tick */
		activeColor?: string;
		/** Default tick class */
		class?: string;
		/** Class for active tick */
		activeClass?: string;
		/** Custom tick renderer */
		custom?: Snippet<[RenderCustomProps]>;
	}

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Scale] No knob context found - component must be a child of Knob');
	}

	const { angleOffset, angleRange, size } = knobContext.config;
	const center = size / 2;

	const props: Props = $props();
	console.debug('[Scale] Initializing with props:', props);

	const {
		type = 'rect',
		tickWidth = 2,
		tickHeight = 10,
		radius = center,
		color = 'currentColor',
		class: className = '',
		custom,
		steps: propSteps
	} = $derived(props);

	const activeColor = $derived(props.activeColor ?? color);
	const activeClassName = $derived(props.activeClass ?? className);
	const steps = $derived(propSteps ?? knobContext.config.steps ?? 10);
	const percentage = $derived(knobContext.state.percentage);
	const length = $derived(steps + (angleRange === 360 ? 0 : 1));
	const stepSize = $derived(angleRange / steps);
	const translateX = $derived(center - tickWidth / 2);
	const translateY = $derived(center - radius);

	$effect(() => {
		console.debug('[Scale] Computed dimensions:', {
			stepSize,
			length,
			translateX,
			translateY
		});
	});

	interface CircleSnippetProps extends RenderProps {
		i: number;
		tickWidth: number;
	}

	interface RectSnippetProps extends RenderProps {
		i: number;
		tickWidth: number;
		tickHeight: number;
	}

	$effect(() => {
		// Log scale updates for debugging
		console.debug('[Scale] State updated:', {
			percentage,
			active: percentage !== null ? Math.round((length - 1) * percentage) : null,
			type,
			steps
		});
	});
</script>

<!--
@snippet circle
@description Renders a circular tick mark
-->
{#snippet circle({
	tickWidth,
	translateX,
	translateY,
	center,
	angleOffset,
	stepSize,
	color,
	active,
	activeColor,
	className,
	activeClassName,
	i
}: CircleSnippetProps)}
	<circle
		r={tickWidth}
		class={[i === active ? activeClassName : className]}
		fill={i === active ? activeColor : color}
		stroke="none"
		transform={`rotate(${angleOffset + stepSize * i} ${center} ${center}) translate(${translateX} ${translateY})`}
	/>
{/snippet}

<!--
@snippet rect
@description Renders a rectangular tick mark
-->
{#snippet rect({
	tickWidth,
	tickHeight,
	translateX,
	translateY,
	angleOffset,
	stepSize,
	center,
	color,
	active,
	activeColor,
	activeClassName,
	className,
	i
}: RectSnippetProps)}
	<rect
		class={[i === active ? activeClassName : className]}
		fill={i === active ? activeColor : color}
		stroke="none"
		width={tickWidth}
		height={tickHeight}
		transform={`
        rotate(${angleOffset + stepSize * i} ${center} ${center}) 
        translate(${translateX} ${translateY})
        `}
	/>
{/snippet}

<g transform="translate(0, -${center})">
	{#if percentage !== null}
		{@const active = Math.round((length - 1) * percentage)}
		{#each Array(length).keys() as i}
			{#if custom}
				{@render custom({
					tickWidth,
					tickHeight,
					translateX,
					translateY,
					angleOffset,
					stepSize,
					center,
					color,
					active,
					activeColor,
					className,
					activeClassName,
					steps,
					percentage,
					i
				})}
			{:else if type === 'circle'}
				{@render circle({
					tickWidth,
					translateX,
					translateY,
					center,
					angleOffset,
					stepSize,
					color,
					active,
					activeColor,
					className,
					activeClassName,
					i
				})}
			{:else if type === 'rect'}
				{@render rect({
					tickWidth,
					tickHeight,
					translateX,
					translateY,
					angleOffset,
					stepSize,
					center,
					color,
					active,
					activeColor,
					className,
					activeClassName,
					i
				})}
			{/if}
		{/each}
	{/if}
</g>
