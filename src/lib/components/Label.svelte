<!--
@component
@name Label
@description Displays text label around the knob at specified angle.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { KnobContext } from '../types.js';

	/**
	 * Props interface for the Label component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Text to display */
		label: string;
		/** Center of the circle */
		center?: number;
		/** Radius of the circle */
		radius: number;
		/** Number of decimal places (if displaying a value) */
		decimalPlace?: number;
		/** CSS class for the text element */
		class?: string;
		/** CSS user-select property value */
		userSelect?: HTMLElement['style']['userSelect'];
		/** Percentage position around the circle */
		percentage: number;
		/** Color of the text */
		color?: string;
	}

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Label] No knob context found - component must be a child of Knob');
	}

	const props: Props = $props();
	console.debug('[Label] Initializing with props:', props);

	const {
		label,
		radius,
		class: className = '',
		userSelect = 'none',
		percentage: propPercentage,
		color = 'currentColor'
	} = $derived(props);

	const angleRange = $derived(knobContext.config.angleRange);
	const angleOffset = $derived(knobContext.config.angleOffset);
	const center = $derived(knobContext.config.size / 2);

	const percentage = $derived(propPercentage ?? knobContext.state.percentage);

	/**
	 * Calculates a point on a circle given center, radius and angle
	 * @param center - Center coordinate
	 * @param radius - Circle radius
	 * @param angle - Angle in degrees
	 * @returns Object with x,y coordinates
	 */
	const pointOnCircle = (center: number, radius: number, angle: number) => {
		console.debug('[Label:pointOnCircle] Input:', { center, radius, angle });
		const rad = (angle * Math.PI) / 180;
		const point = {
			x: center + radius * Math.cos(rad),
			y: center + radius * Math.sin(rad)
		};
		console.debug('[Label:pointOnCircle] Calculated point:', point);
		return point;
	};

	$effect(() => {
		if (label && percentage !== null) {
			const angle = angleOffset + 90 + angleRange * percentage;
			console.debug('[Label] State updated:', {
				angle,
				percentage,
				position: pointOnCircle(center, radius, angle)
			});
		}
	});
</script>

{#if label && percentage !== null}
	{@const angle = angleOffset + 90 + angleRange * percentage}
	{@const p = pointOnCircle(center, radius, angle)}
	<g transform={`translate( ${center - p.x} ${center - p.y})`}>
		<text
			style={`user-select: ${userSelect}; fill: ${color};`}
			x="50%"
			y="50%"
			text-anchor="middle"
			dominant-baseline="middle"
			class={className}
		>
			{label}
		</text>
	</g>
{/if}
