<script lang="ts">
	import Knob from '$lib/components/Knob.svelte';
	import Pointer from '$lib/components/Pointer.svelte';
	import Range from '$lib/components/Range.svelte';
	import Value from '$lib/components/Value.svelte';
	import { onMount, onDestroy } from 'svelte';

	type Props = {
		initialPosition?: number;
		velocity?: number;
		target?: number;
	};

	const { initialPosition = 45, velocity = 30, target = 45 }: Props = $props();

	// Motor simulation state
	let currentValue: number = $state(initialPosition);
	let editedValue: number = $state(target);
	let showEditedValue: boolean = $state(false);

	const size = 120;
	const pointerSize = 10;
	const outerKnobRadius = size * 0.5;
	const pointerPosRadius = outerKnobRadius - pointerSize * 2;

	let interval: ReturnType<typeof setInterval> | null = null;

	// Persistent motor simulation effect that updates motorPosition towards knobTarget
	onMount(() => {
		interval = setInterval(() => {
			if (currentValue !== editedValue) {
				const diff = editedValue - currentValue;
				const step = Math.min(Math.abs(diff), velocity) * Math.sign(diff);
				currentValue += step;
				if (Math.abs(diff) < 0.1) {
					currentValue = editedValue;
				}
			}
		}, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function handleInteractiveChange(value: number) {
		editedValue = value;
		showEditedValue = true;
	}

	function handleEnd() {
		showEditedValue = false;
	}
</script>

<Knob
	{size}
	initialValue={currentValue}
	angleOffset={0}
	angleRange={360}
	min={0}
	max={360}
	tracking={true}
	onInteractiveChange={handleInteractiveChange}
	onEnd={handleEnd}
>
	<circle
		r={pointerPosRadius + pointerSize}
		cx={size / 2}
		cy={size / 2}
		fill="transparent"
		stroke="#ced4da"
		stroke-width={pointerSize}
	/>
	<Range
		percentageFrom={currentValue / 360}
		percentageTo={editedValue / 360}
		radius={pointerPosRadius + pointerSize * 1.5}
		color="#ff9800"
		arcWidth={pointerSize}
	/>
	<Pointer
		percentage={editedValue / 360}
		width={pointerSize}
		height={pointerSize}
		radius={pointerPosRadius}
		type="circle"
		color="#ff9800"
	/>
	<Pointer
		percentage={currentValue / 360}
		width={pointerSize}
		height={pointerSize}
		radius={pointerPosRadius}
		type="circle"
		color="#000"
	/>
	{#if showEditedValue}
		<Value value={editedValue} decimalPlace={2} marginBottom={size / 2} class="knob-text" />
	{:else}
		<Value value={currentValue} decimalPlace={2} marginBottom={size / 2} class="knob-text" />
	{/if}
</Knob>
