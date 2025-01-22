<!--
@component
@name Value
@description Displays the current value of the knob as text.
Supports decimal places formatting and vertical positioning.
-->
<script lang="ts">
	import type { KnobContext } from '$lib/types.js';
	import { getContext } from 'svelte';

	/**
	 * Props interface for the Value component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Center of the circle */
		center?: number;
		/** Radius of the circle */
		radius?: number;
		/** Number of decimal places to display */
		decimalPlace?: number;
		/** CSS class for the text element */
		class?: string;
		/** Bottom margin in pixels */
		marginBottom?: number;
		/** Color of the text */
		color?: string;
		/** Value to display */
		value?: number;
	}

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Value] No knob context found - component must be a child of Knob');
	}

	const props: Props = $props();
	console.info('[Value] Initializing with props:', props);

	const {
		radius = knobContext.config.size / 2,
		decimalPlace = 0,
		class: className = '',
		marginBottom = 0,
		color = 'currentColor'
	} = $derived(props);
	const value = $derived(props.value ?? knobContext.state.value);

	/**
	 * Removes negative sign from zero values
	 * @param value - String representation of number
	 * @returns Formatted string without negative zero
	 */
	const trimNegativeZero = (value: string) => {
		console.debug('[Value:trimNegativeZero] Input:', value);
		if (value.startsWith('-') && Number.parseFloat(value) === 0) {
			console.debug('[Value:trimNegativeZero] Removing negative from zero');
			return value.slice(1);
		}
		return value;
	};

	$effect(() => {
		// Log value updates for debugging
		console.debug('[Value] State updated:', {
			value,
			formattedValue: value !== null ? trimNegativeZero(value.toFixed(decimalPlace)) : null,
			radius,
			marginBottom
		});
	});
</script>

{#if value !== null && value !== undefined}
	<text
		style={`user-select: none; fill: ${color};`}
		x="50%"
		text-anchor="middle"
		class={className}
		y={(radius ?? 0) - marginBottom}
	>
		{trimNegativeZero(value.toFixed(decimalPlace))}
	</text>
{/if}
