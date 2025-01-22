<!--
@component
@name Arc
@description Renders an arc showing the current value of the knob.
Can optionally show a background arc for the full range.
Uses the Range component internally to render the arcs.
-->
<script lang="ts">
	import Range from './Range.svelte';
	import { getContext } from 'svelte';
	import type { KnobContext } from '../types.js';

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Arc] No knob context found - component must be a child of Knob');
	}

	/**
	 * Props interface for the Arc component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Current percentage (0-1) to display. Falls back to knob context value if not provided */
		percentage?: number;
		/** Color of the value arc */
		color?: string;
		/** Color of the background arc */
		background?: string;
		/** Width of the arc in pixels */
		arcWidth: number;
		/** CSS class for the value arc */
		class?: string;
		/** CSS class for the background arc */
		activeClass?: string;
		/** Radius of the arc in pixels */
		radius?: number;
	}

	const props: Props = $props();
	console.info('[Arc] Initializing with props:', props);

	const {
		color = 'currentColor',
		background,
		percentage: propPercentage,
		class: className,
		activeClass,
		radius,
		...rest
	} = $derived(props);
	const percentage = $derived.by(() => propPercentage ?? knobContext.state.percentage ?? undefined);

	$effect(() => {
		// Log arc updates for debugging
		console.debug('[Arc] State updated:', {
			percentage,
			contextPercentage: knobContext.state.percentage,
			color,
			background,
			...rest,
			radius
		});
	});
</script>

<g>
	{#if background}
		<Range
			{percentage}
			percentageFrom={percentage ?? null}
			percentageTo={1}
			color={background}
			class={activeClass}
			{...rest}
			{radius}
		/>
	{/if}
	<Range
		{percentage}
		percentageFrom={0}
		percentageTo={percentage ?? null}
		{color}
		class={className}
		{...rest}
		{radius}
	/>
</g>
