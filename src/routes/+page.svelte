<!--
@component
@description Example page showing various knob component configurations.
-->
<script lang="ts">
	import '../app.css';
	import Knob from '$lib/components/Knob.svelte';
	import Arc from '$lib/components/Arc.svelte';
	import Pointer from '$lib/components/Pointer.svelte';
	import Scale from '$lib/components/Scale.svelte';
	import Value from '$lib/components/Value.svelte';
	import Label from '$lib/components/Label.svelte';
	import Range from '$lib/components/Range.svelte';
	import { onMount } from 'svelte';

	/**
	 * Props passed to custom scale tick snippets
	 */
	interface ScaleTickProps {
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
		/** Current tick index */
		i: number;
		/** Total number of steps */
		steps: number;
		/** Current percentage value */
		percentage: number;
	}

	/**
	 * Props passed to custom pointer snippets
	 */
	interface PointerProps {
		/** Width of the pointer */
		width: number;
		/** Height of the pointer */
		height: number;
		/** Current percentage value */
		percentage: number;
	}

	const colors = {
		primary: '#FC5A96',
		secondary: '#180094',
		shadow: '#CCCCCC'
	};

	let controlledValue = $state(33);

	// Mock motor implementation
	class MockMotor {
		private target: number | null = null;
		private position: number;
		private velocity: number;
		private interval!: number;
		private onChange: (position: number) => void;

		constructor(initialPosition: number, velocity: number, onChange: (position: number) => void) {
			this.position = initialPosition;
			this.velocity = velocity;
			this.onChange = onChange;
			this.startLoop();
		}

		private startLoop() {
			this.interval = setInterval(() => {
				if (this.target !== null) {
					const diff = this.target - this.position;
					const step = Math.min(Math.abs(diff), this.velocity) * Math.sign(diff);
					this.position += step;
					this.onChange(this.position);

					if (Math.abs(diff) < 0.1) {
						this.position = this.target;
						this.target = null;
					}
				}
			}, 1000) as unknown as number;
		}

		public setTarget(target: number) {
			this.target = target;
		}

		public stop() {
			clearInterval(this.interval);
		}
	}

	let motorPosition = $state(45);
	let motorTarget = $state<number | null>(null);
	let motor: MockMotor;

	onMount(() => {
		motor = new MockMotor(45, 30, (pos) => {
			motorPosition = pos;
		});

		return () => {
			motor.stop();
		};
	});

	function onMotorKnobChange(value: number) {
		motorTarget = value;
		motor?.setTarget(value);
	}
</script>

<div class="examples">
	<div class="example">
		<span class="title">Pointer Example (Controlled)</span>
		<Knob
			size={100}
			angleOffset={220}
			angleRange={280}
			min={0}
			max={100}
			value={controlledValue}
			onChange={(v) => (controlledValue = v)}
		>
			<Pointer width={3} radius={40} type="circle" color={colors.primary} />
		</Knob>
		<div>External value: {controlledValue}</div>
	</div>

	<div class="example">
		<span class="title">Arc Example (Uncontrolled)</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={45}>
			<Arc arcWidth={5} color={colors.primary} background={colors.secondary} />
		</Knob>
	</div>

	<div class="example">
		<span class="title">Scale Example (Uncontrolled)</span>
		<Knob
			size={100}
			angleOffset={220}
			angleRange={280}
			min={0}
			max={100}
			initialValue={60}
			steps={10}
		>
			<Scale
				tickWidth={3}
				tickHeight={5}
				radius={45}
				color={colors.secondary}
				activeColor={colors.primary}
			/>
		</Knob>
	</div>

	<div class="example">
		<span class="title">Value Example (Uncontrolled)</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={75}>
			<Value marginBottom={10} />
		</Knob>
	</div>

	<div class="example">
		<span class="title">Label Example (Uncontrolled)</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={50}>
			<Label percentage={0.0} radius={40} label="0%" />
			<Label percentage={0.25} radius={40} label="25%" />
			<Label percentage={0.5} radius={40} label="50%" />
			<Label percentage={0.75} radius={40} label="75%" />
			<Label percentage={1.0} radius={40} label="100%" />
		</Knob>
	</div>

	<div class="example">
		<span class="title">Range Example (Uncontrolled)</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={80}>
			<Range arcWidth={10} color="#e44b02" percentageFrom={0.0} percentageTo={0.5} />
			<Range arcWidth={10} color="#ffc90e" percentageFrom={0.5} percentageTo={0.75} />
			<Range arcWidth={10} color="#6caa03" percentageFrom={0.75} percentageTo={1.0} />
		</Knob>
	</div>

	<div class="example">
		<span class="title">Custom Pointer Example</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={50}>
			<Arc arcWidth={5} color={colors.primary} radius={47.5} />
			<Pointer width={3} height={40} radius={0} color={colors.primary}>
				{#snippet children({ width, height, percentage }: PointerProps)}
					<rect
						{width}
						height={5 + height * percentage}
						fill="hsl({Math.round(360 * percentage)}, 50%, 50%)"
					/>
				{/snippet}
			</Pointer>
		</Knob>
	</div>

	<div class="example">
		<span class="title">Custom Scale Example</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={50}>
			<Scale steps={40} tickWidth={1} tickHeight={5} radius={45}>
				{#snippet custom({
					translateX,
					translateY,
					angleOffset,
					stepSize,
					center,
					i,
					percentage,
					steps
				}: ScaleTickProps)}
					<rect
						fill="hsl({(240 + (40 - i) * 4) % 360}, 100%, 60%)"
						stroke="none"
						width={1}
						height={i === Math.round(steps * percentage) ? 9 : 5}
						transform="rotate({angleOffset +
							stepSize * i} {center} {center}) translate({translateX} {translateY})"
					/>
				{/snippet}
			</Scale>
		</Knob>
	</div>

	<div class="example">
		<span class="title">Dark Gradient Example</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={50}>
			<defs>
				<radialGradient id="shadow" cx={0.5} cy={0.5} r={0.5} gradientUnits="objectBoundingBox">
					<stop offset={0.0} style="stop-color: #000" />
					<stop offset={0.9} style="stop-color: #000; stop-opacity: 0.3" />
					<stop offset={1.0} style="stop-color: #000; stop-opacity: 0" />
				</radialGradient>
				<radialGradient id="bg" cx={0.7} cy={0.9} r={0.7} gradientUnits="objectBoundingBox">
					<stop offset={0.0} style="stop-color: #656870" />
					<stop offset={1.0} style="stop-color: #51555e" />
				</radialGradient>
				<radialGradient id="bgStroke" cx={0.9} cy={0.9} r={0.3} gradientUnits="objectBoundingBox">
					<stop offset={0.0} style="stop-color: #71767c" />
					<stop offset={1.0} style="stop-color: #393e44" />
				</radialGradient>
				<radialGradient id="pt" cx={0.5} cy={0.25} r={0.5} gradientUnits="objectBoundingBox">
					<stop offset={0.0} style="stop-color: #6c6f76" />
					<stop offset={1.0} style="stop-color: #4f545a" />
				</radialGradient>
				<linearGradient
					id="ptStroke"
					x1={0.5}
					x2={0.5}
					y1={0.0}
					y2={1.0}
					gradientUnits="objectBoundingBox"
				>
					<stop offset={0.0} style="stop-color: #71767c" />
					<stop offset={1.0} style="stop-color: #4f545a" />
				</linearGradient>
			</defs>
			<circle cx={50} cy={50} r={45} style="fill: url(#shadow)" />
			<Scale steps={15} tickWidth={2} tickHeight={5} radius={60} color="#505050" />
			<circle
				cx={50}
				cy={50}
				r={45}
				style="fill: url(#bg); stroke: url(#bgStroke); stroke-width: 6"
			/>
			<Pointer width={7.5} height={7.5} useRotation={false} radius={25}>
				<circle
					cx={0}
					cy={0}
					r={10}
					style="fill: url(#pt); stroke: url(#ptStroke); stroke-width: 3"
				/>
			</Pointer>
		</Knob>
	</div>

	<div class="example">
		<span class="title">Light and LED Example</span>
		<Knob size={100} angleOffset={220} angleRange={280} min={0} max={100} initialValue={50}>
			<defs>
				<linearGradient id="k3bg1" x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
					<stop stop-color="#b2b2b2" offset="0" />
					<stop stop-color="#d7d7d7" offset="1" />
				</linearGradient>
				<radialGradient id="k3bg2" cx="1" cy="1" r="1" gradientUnits="objectBoundingBox">
					<stop stop-color="#f7f7f7" offset="0" />
					<stop stop-color="#e6e6e6" offset="1" />
				</radialGradient>
			</defs>
			<circle cx={50} cy={50} r={40} fill="url(#k3bg1)" />
			<circle cx={50} cy={50} r={37} fill="url(#k3bg2)" />
			<Scale steps={20} tickWidth={2} tickHeight={5} radius={50}>
				{#snippet custom({
					translateX,
					translateY,
					angleOffset,
					stepSize,
					center,
					i,
					percentage,
					steps
				}: ScaleTickProps)}
					<circle
						cx={0}
						cy={0}
						r={5}
						fill={i < percentage * (steps + 1) ? '#48c7ff' : '#e8e8e8'}
						transform="rotate({angleOffset +
							stepSize * i} {center} {center}) translate({translateX} {translateY})"
					/>
				{/snippet}
			</Scale>
		</Knob>
	</div>

	<div class="example">
		<span class="title">Async Motor Example</span>
		<Knob
			size={100}
			angleOffset={0}
			angleRange={360}
			min={0}
			max={360}
			value={motorPosition}
			onChange={onMotorKnobChange}
		>
			<circle r={45} cx={50} cy={50} fill="transparent" stroke="#ced4da" stroke-width={10} />
			{#if motorTarget !== null}
				<Range
					percentageFrom={motorPosition / 360}
					percentageTo={motorTarget / 360}
					radius={50}
					color="#ff9800"
					arcWidth={10}
				/>
				<Pointer
					percentage={motorTarget / 360}
					width={10}
					height={10}
					radius={50}
					type="circle"
					color="#ff9800"
				/>
			{/if}
			<Pointer
				percentage={motorPosition / 360}
				width={10}
				height={10}
				radius={50}
				type="circle"
				color="#000"
			/>
			<Value value={motorPosition} decimalPlace={2} marginBottom={60} />
		</Knob>
	</div>
</div>

<style>
	.examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		padding: 2rem;
	}

	.example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}

	.title {
		font-size: 1.2rem;
		font-weight: bold;
		color: #333;
	}

	:global(.value) {
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
		fill: #fc5a96;
		font-size: 1.5rem;
	}
</style>
