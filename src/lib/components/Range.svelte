<!--
@component
@name Range
@description Renders an SVG path representing a range between two percentages.
Used by Arc component to render value and background arcs.

SVG Path Generation:
- Calculates start and end points on circle based on percentages
- Uses arc commands for smooth curved paths
- Handles special cases for full circles and tiny angles
- Clamps angles to prevent rendering issues at exact 360/-360 degrees

Path Structure:
- M: Move to start point
- A: Arc from start to end point
- L: Line to center (for fill)
- Z: Close path
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { KnobContext } from '../types.js';

	/**
	 * Calculates a point on a circle given center, radius and angle
	 * @param center - Center coordinate
	 * @param radius - Circle radius
	 * @param angle - Angle in radians
	 * @returns Object with x,y coordinates
	 */
	const pointOnCircle = (center: number, radius: number, angle: number) => {
		const point = {
			x: center + radius * Math.cos(angle),
			y: center + radius * Math.sin(angle)
		};
		console.debug('[Range:pointOnCircle]', { center, radius, angle, point });
		return point;
	};

	/**
	 * Converts degrees to radians
	 */
	const degTorad = (deg: number) => (Math.PI * deg) / 180;

	/**
	 * Clamps degree value to prevent SVG rendering issues at exact 360/-360
	 */
	const clampDeg = (deg: number) => (deg >= 360 ? 359.999 : deg <= -360 ? -359.999 : deg);

	/**
	 * Calculates the SVG path for an arc between two percentages
	 * @param params - Object containing all parameters needed for path calculation
	 * @returns SVG path string
	 */
	const calcPath = ({
		percentageFrom,
		percentageTo,
		angleOffset,
		angleRange,
		arcWidth,
		radius: outerRadius,
		center
	}: {
		percentageFrom: number;
		percentageTo: number;
		angleOffset: number;
		angleRange: number;
		arcWidth: number;
		radius: number;
		center: number;
	}) => {
		console.debug('[Range:calcPath] Input:', {
			percentageFrom,
			percentageTo,
			angleOffset,
			angleRange,
			arcWidth,
			outerRadius,
			center
		});

		const angle = angleRange * (percentageTo - percentageFrom);
		const clampedAngle = clampDeg(angle);
		const angleFrom = angleOffset - 90 + angleRange * percentageFrom;
		const innerRadius = outerRadius - arcWidth;
		const angleFromRad = degTorad(angleFrom);
		const angleToRad = degTorad(angleFrom + clampedAngle);
		const largeArcFlag = Math.abs(clampedAngle) < 180 ? 0 : 1;
		const direction = clampedAngle >= 0 ? 1 : 0;

		console.debug('[Range:calcPath] Calculated angles:', {
			angle,
			clampedAngle,
			angleFrom,
			angleFromRad,
			angleToRad,
			largeArcFlag,
			direction
		});

		const p1 = pointOnCircle(center, outerRadius, angleFromRad);
		const p2 = pointOnCircle(center, outerRadius, angleToRad);
		const p3 = pointOnCircle(center, innerRadius, angleToRad);
		const p4 = pointOnCircle(center, innerRadius, angleFromRad);

		const path = `M${p1.x},${
			p1.y
		} A${outerRadius},${outerRadius} 0 ${largeArcFlag} ${direction} ${p2.x},${
			p2.y
		}L${p3.x},${p3.y} A${innerRadius},${innerRadius} 0 ${largeArcFlag} ${
			1 - direction
		} ${p4.x},${p4.y} L${p1.x},${p1.y}`;

		console.debug('[Range:calcPath] Generated path:', path);
		return path;
	};

	/**
	 * Props interface for the Range component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Color of the range arc */
		color?: string;
		/** Width of the arc in pixels */
		arcWidth: number;
		/** Current percentage value */
		percentage?: number;
		/** Starting percentage of range */
		percentageFrom: number | null;
		/** Ending percentage of range */
		percentageTo: number | null;
		/** Outer radius of the arc */
		radius?: number;
		/** Deprecated: use radius instead */
		outerRadius?: number;
		/** CSS class for the range */
		class?: string;
	}

	const props: Props = $props();
	console.info('[Range] Initializing with props:', props);

	const {
		color = 'currentColor',
		percentageFrom = null,
		percentageTo = null,
		percentage: propPercentage,
		class: className = ''
	} = $derived(props);
	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Range] No knob context found - component must be a child of Knob');
	}

	const { angleOffset, angleRange } = knobContext.config;

	const contextPercentage = $derived(knobContext.state.percentage);
	const p = $derived.by(() => propPercentage ?? contextPercentage);

	// Determine the actual range to render based on provided percentages
	const pfrom = $derived.by(() => {
		if (percentageFrom !== null && percentageTo !== null) {
			return percentageFrom;
		} else if (percentageFrom !== null) {
			return percentageFrom;
		} else if (percentageTo !== null) {
			return p;
		} else {
			return 0;
		}
	});

	const pto = $derived.by(() => {
		if (percentageFrom !== null && percentageTo !== null) {
			return percentageTo;
		} else if (percentageFrom !== null) {
			return p;
		} else if (percentageTo !== null) {
			return percentageTo;
		} else {
			return p;
		}
	});

	$effect(() => {
		console.debug('[Range] Calculated range:', { pfrom, pto });
	});

	let d: string | null = $derived.by(() => {
		if (pfrom === null || pto === null) {
			console.debug('[Range] No valid range to render');
			return null;
		}
		return calcPath({
			...props,
			percentageFrom: pfrom,
			percentageTo: pto,
			angleOffset,
			angleRange,
			radius: props.radius ?? knobContext.config.size / 2,
			center: knobContext.config.size / 2
		});
	});

	$effect(() => {
		// Log range updates for debugging
		console.debug('[Range] State updated:', {
			path: d,
			color,
			percentageFrom: pfrom,
			percentageTo: pto
		});
	});
</script>

{#if d}
	<g>
		<path {d} style={`fill: ${color}`} class={className} />
	</g>
{/if}
