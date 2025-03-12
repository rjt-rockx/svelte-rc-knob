<script lang="ts">
	import Knob from '$lib/components/Knob.svelte';
	import Pointer from '$lib/components/Pointer.svelte';
	import Spiral from '$lib/components/Spiral.svelte';
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

	// Compute target radius for spiral display based on the difference
	const diff = $derived(Math.abs(editedValue - currentValue));
	const rawRadius = $derived((diff / 360) * pointerSize * 1.5);
	const targetRadius = $derived(rawRadius > pointerPosRadius ? pointerPosRadius : rawRadius);

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
	tracking={false}
	multiRotation={true}
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
	<Spiral
		percentageFrom={currentValue / 360}
		percentageTo={editedValue / 360}
		radiusFrom={pointerPosRadius + pointerSize * 1.5}
		radiusTo={pointerPosRadius + pointerSize * 1.5 - targetRadius}
		color="#ff9800"
		arcWidth={pointerSize}
	/>
	<Pointer
		percentage={editedValue / 360}
		width={pointerSize}
		height={pointerSize}
		radius={pointerPosRadius - targetRadius}
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
