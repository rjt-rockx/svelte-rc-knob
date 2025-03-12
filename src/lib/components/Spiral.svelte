<!--
@component
@name Spiral
@description Renders a spiral path between two points with varying radius.
Useful for multi-rotation knobs to show winding progression.
-->
<script lang="ts">
	import type { KnobContext } from '$lib/types.js';
	import { getContext } from 'svelte';

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
		console.debug('[Spiral:pointOnCircle]', { center, radius, angle, point });
		return point;
	};

	/**
	 * Converts degrees to radians
	 */
	const degTorad = (deg: number) => (Math.PI * deg) / 180;

	/**
	 * Orders two value-percentage pairs by value
	 * @returns Array of [minValue, minPercentage, maxValue, maxPercentage]
	 */
	function ordered(v1: number, p1: number, v2: number, p2: number) {
		console.debug('[Spiral:ordered] Input:', { v1, p1, v2, p2 });
		if (v1 <= v2) {
			return [v1, p1, v2, p2];
		} else {
			return [v2, p2, v1, p1];
		}
	}

	/**
	 * Props for path calculation
	 */
	interface CalcPathProps {
		/** Starting percentage */
		percentageFrom: number | null;
		/** Ending percentage */
		percentageTo: number | null;
		/** Starting angle offset */
		angleOffset: number;
		/** Total angle range */
		angleRange: number;
		/** Width of the spiral line */
		arcWidth: number;
		/** Starting outer radius */
		outerRadiusFrom: number;
		/** Ending outer radius */
		outerRadiusTo: number;
		/** Center point */
		center: number;
	}

	/**
	 * Calculates the SVG path for a spiral between two points
	 * @param params - Object containing all parameters needed for path calculation
	 * @returns SVG path string
	 */
	const calcPath = ({
		percentageFrom,
		percentageTo,
		angleOffset,
		angleRange,
		arcWidth,
		outerRadiusFrom,
		outerRadiusTo,
		center
	}: CalcPathProps) => {
		console.debug('[Spiral:calcPath] Input:', {
			percentageFrom,
			percentageTo,
			angleOffset,
			angleRange,
			arcWidth,
			outerRadiusFrom,
			outerRadiusTo,
			center
		});

		if (percentageFrom === null || percentageTo === null) {
			console.debug('[Spiral:calcPath] Missing percentages, returning empty path');
			return '';
		}

		const [percentageMin, outerRadiusMin, percentageMax, outerRadiusMax] = ordered(
			percentageFrom,
			outerRadiusFrom,
			percentageTo,
			outerRadiusTo
		);
		const angle = angleRange * (percentageMax - percentageMin);
		const startAngle = angleOffset - 90 + angleRange * percentageMin;
		const startAngleRad = degTorad(startAngle);
		const endAngleRad = degTorad(startAngle + angle);

		console.debug('[Spiral:calcPath] Calculated angles:', {
			angle,
			startAngle,
			startAngleRad,
			endAngleRad
		});

		const nb = Math.ceil(percentageMax - percentageMin) * 4;
		let forth = '';
		let start = '';
		let back = '';
		let link = '';

		for (let i = 0; i <= nb; i++) {
			const coef = i / nb;
			const outerRadius = outerRadiusMin + (outerRadiusMax - outerRadiusMin) * coef;
			const innerRadius = outerRadius - arcWidth;
			const angleRad = startAngleRad + (endAngleRad - startAngleRad) * coef;
			const angleDeg = ((angleRad * 180) / Math.PI) * coef;
			const po = pointOnCircle(center, outerRadius, angleRad);
			const pi = pointOnCircle(center, innerRadius, angleRad);

			if (i === 0) {
				start = `${po.x},${po.y} `;
			} else {
				forth += `${outerRadius},${outerRadius} ${angleDeg} 0 1 ${po.x},${po.y} `;
			}
			if (i === nb) {
				link = `${pi.x},${pi.y} `;
			} else {
				back = `${innerRadius},${innerRadius} ${angleDeg} 0 0 ${pi.x},${pi.y} ` + back;
			}
		}

		const path = `M ${start}A ${forth}L ${link}A ${back}z`;
		console.debug('[Spiral:calcPath] Generated path:', path);
		return path;
	};

	/**
	 * Props interface for the Spiral component
	 * @typedef {Object} Props
	 */
	interface Props {
		/** Color of the spiral */
		color?: string;
		/** Starting percentage (defaults to 0 or current percentage) */
		percentageFrom?: number | null;
		/** Starting radius */
		radiusFrom?: number | null;
		/** Ending percentage (defaults to current percentage) */
		percentageTo?: number | null;
		/** Ending radius */
		radiusTo?: number | null;
		/** Width of the spiral line */
		arcWidth: number;
		/** Percentage position around the circle */
		percentage?: number;
	}

	const props: Props = $props();
	console.debug('[Spiral] Initializing with props:', props);

	const {
		color = 'currentColor',
		percentage = null,
		percentageFrom = null,
		radiusFrom = null,
		percentageTo = null,
		radiusTo = null
	} = $derived(props);

	const knobContext: KnobContext = getContext('knob');
	if (!knobContext) {
		console.error('[Spiral] No knob context found - component must be a child of Knob');
	}

	const pfrom: number | null = $derived(percentageFrom ?? (percentageTo !== null ? percentage : 0));
	const pto: number | null = $derived(percentageTo ?? percentage);

	$effect(() => {
		// Log spiral updates for debugging
		console.debug('[Spiral] State updated:', {
			percentage,
			pfrom,
			pto,
			radiusFrom,
			radiusTo
		});
	});

	const angleRange = $derived(knobContext.config.angleRange);
	const angleOffset = $derived(knobContext.config.angleOffset);
	const center = $derived(knobContext.config.size / 2);
</script>

{#if radiusFrom !== null && radiusTo !== null && pfrom !== null && pto !== null}
	{@const d = calcPath({
		...props,
		percentageFrom: pfrom,
		percentageTo: pto,
		outerRadiusFrom: radiusFrom,
		outerRadiusTo: radiusTo,
		angleOffset,
		angleRange,
		center
	})}
	<g>
		<path {d} style={`fill: ${color}`} />
	</g>
{/if}
