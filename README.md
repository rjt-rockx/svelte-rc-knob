# svelte-knob

A highly customizable and accessibleknob component for Svelte applications.
Ported from [rc-knob](https://github.com/vallsv/rc-knob) originally created by [eskimoblood](https://github.com/eskimoblood) and updated by [vallsv](https://github.com/vallsv).

## Overview

The component architecture separates user interaction and value calculation from the visual rendering. This separation allows for maximum flexibility and customization:

- `<Knob>`: The root component that handles all user interactions and logic
- Visual UI components (all rendered as SVG):
  - `<Arc>`: Renders the knob's arc
  - `<Pointer>`: Displays the knob's pointer
  - `<Scale>`: Shows the knob's scale
  - `<Value>`: Renders the current value

### State Management

The component uses Svelte 5's runes and a dedicated state store created via `createKnobState`. The `<Knob>` component provides state and configuration to child components through Svelte's context system with the following structure:

```typescript
interface KnobContext {
	state: {
		isActive: boolean;
		min: number;
		max: number;
		value: number | null;
		percentage: number | null;
		mouseAngle: number | null;
		startPercentage: number | null;
		startValue: number | null;
		multiRotation: boolean;
		angleOffset: number;
		angleRange: number;
		tracking: boolean;
		size: number;
		steps?: number;
	};
	config: {
		size: number;
		angleOffset: number;
		angleRange: number;
		steps?: number;
	};
}
```

### Child Components

Instead of passing callback functions directly to child components, we use Svelte 5's snippet feature. Each visual component accepts a snippet that receives the necessary props for custom rendering. All components render SVG elements and must be placed within the `<Knob>`'s SVG container.

### Basic Example

```svelte
<script>
	import { Knob, Pointer, Value } from 'svelte-knob';

	let value = $state(0);
</script>

<Knob bind:value min={0} max={100} size={200}>
	<Value />
	<Pointer width={1} height={2}>
		{#snippet pointer(props)}
			<!-- Custom pointer implementation -->
			<rect {...props} />
		{/snippet}
	</Pointer>
</Knob>
```

## Component API

### `<Knob>`

The root component that handles all user interactions. It renders a `<div>` with ARIA slider attributes containing an SVG element where all child components are rendered. The knob supports:

- Mouse, scroll wheel, and keyboard arrow key interactions
- Keyboard accessibility via `tab`
- Two modes of operation:
  - Controlled: using the `value` prop
  - Uncontrolled: using the `initialValue` prop

#### Props

| Prop                  | Type     | Default | Required | Description                                                           |
| --------------------- | -------- | ------- | -------- | --------------------------------------------------------------------- |
| `min`                 | number   |         | Yes      | Minimum value                                                         |
| `max`                 | number   |         | Yes      | Maximum value                                                         |
| `size`                | number   |         | Yes      | Width and height in pixels                                            |
| `angleOffset`         | number   | 0       | No       | Starting angle offset in degrees (0° is at top, clockwise)            |
| `angleRange`          | number   | 360     | No       | Total rotation range in degrees (clockwise)                           |
| `ariaLabelledBy`      | string   |         | No       | Sets the `aria-labelledby` attribute                                  |
| `ariaValueText`       | string   |         | No       | Sets the `aria-valuetext` attribute                                   |
| `class`               | string   |         | No       | CSS class for the container div                                       |
| `svgClass`            | string   |         | No       | CSS class for the SVG element                                         |
| `initialValue`        | number   | null    | No       | Starting value for uncontrolled mode                                  |
| `value`               | number   | null    | No       | Current value for controlled mode                                     |
| `interactiveHook`     | function |         | No       | Customizes knob behavior during mouse interaction (see details below) |
| `multiRotation`       | boolean  | false   | No       | Enables unlimited rotation (ignores min/max limits)                   |
| `onChange`            | function | noop    | No       | Callback for value changes (after interaction ends)                   |
| `onEnd`               | function | noop    | No       | Callback when dragging ends                                           |
| `onInteractiveChange` | function | noop    | No       | Callback during dragging                                              |
| `onStart`             | function | noop    | No       | Callback when dragging starts                                         |
| `readOnly`            | boolean  | false   | No       | Disables user interaction                                             |
| `snap`                | boolean  | false   | No       | Enables snapping to steps (requires `steps` to be set)                |
| `steps`               | number   |         | No       | Number of snap points                                                 |
| `tracking`            | boolean  | true    | No       | Controls when `onChange` fires during dragging                        |
| `useMouseWheel`       | boolean  | true    | No       | Enables mouse wheel interaction                                       |

#### Interactive Hook

The `interactiveHook` function allows fine-grained control over knob behavior based on mouse position. It receives an event object with:

```typescript
interface InteractiveHookEvent {
	mouseRadius: number; // Distance from knob center
	mouseAngle: number; // Angle in degrees (0-360, 0° at top, clockwise)
	mouseX: number; // X position relative to center
	mouseY: number; // Y position relative to center
	ctrlKey: boolean; // Ctrl key state
	altKey: boolean; // Alt key state
	metaKey: boolean; // Meta key state
	shiftKey: boolean; // Shift key state
}
```

The function should return an object that can include:

```typescript
interface InteractiveHookResult {
	readOnly?: boolean; // Disables interaction when true
	steps?: number; // Number of snap points
}
```

Example:

```typescript
function interactiveHook(e: InteractiveHookEvent): InteractiveHookResult {
	if (e.mouseRadius < 20) {
		return { readOnly: true }; // Disable interaction near center
	}
	return {};
}
```

### `<Arc>`

Renders an arc showing the current value of the knob. Uses the `<Range>` component internally to render both the value arc and an optional background arc.

#### Props

| Prop          | Type   | Default        | Description                                                            |
| ------------- | ------ | -------------- | ---------------------------------------------------------------------- |
| `arcWidth`    | number | Required       | Width of the arc in pixels                                             |
| `percentage`  | number | context value  | Current percentage (0-1) to display                                    |
| `color`       | string | 'currentColor' | Color of the value arc                                                 |
| `background`  | string | undefined      | Color of the background arc. If not set, no background arc is rendered |
| `radius`      | number | knob size / 2  | Outer radius of the arc in pixels                                      |
| `class`       | string | undefined      | CSS class for the value arc                                            |
| `activeClass` | string | undefined      | CSS class for the background arc                                       |

### `<Range>`

Low-level component that renders an SVG path representing a range between two percentages. Used internally by the `<Arc>` component but can also be used directly for custom range visualizations.

The path is generated using SVG arc commands and handles special cases for full circles and tiny angles. It automatically clamps angles to prevent rendering issues at exact 360/-360 degrees.

#### Props

| Prop             | Type   | Default        | Description                  |
| ---------------- | ------ | -------------- | ---------------------------- |
| `arcWidth`       | number | Required       | Width of the arc in pixels   |
| `color`          | string | 'currentColor' | Color of the range arc       |
| `percentage`     | number | context value  | Current percentage value     |
| `percentageFrom` | number | null           | Starting percentage of range |
| `percentageTo`   | number | null           | Ending percentage of range   |
| `radius`         | number | knob size / 2  | Outer radius of the arc      |
| `class`          | string | ''             | CSS class for the range      |

The component uses the following logic to determine the actual range to render:

1. If both `percentageFrom` and `percentageTo` are provided, uses them directly
2. If only `percentageFrom` is provided, uses it as start and `percentage` as end
3. If only `percentageTo` is provided, uses `percentage` as start and `percentageTo` as end
4. If neither is provided, uses 0 as start and `percentage` as end

### `<Spiral>`

Renders a spiral path between two points with varying radius. Particularly useful for multi-rotation knobs to show winding progression. The spiral is rendered as an SVG path with smooth transitions between points.

#### Props

| Prop             | Type   | Default        | Description                                       |
| ---------------- | ------ | -------------- | ------------------------------------------------- |
| `arcWidth`       | number | Required       | Width of the spiral line                          |
| `color`          | string | 'currentColor' | Color of the spiral                               |
| `percentage`     | number | context value  | Current percentage value                          |
| `percentageFrom` | number | null           | Starting percentage (defaults to 0 or percentage) |
| `percentageTo`   | number | null           | Ending percentage (defaults to percentage)        |
| `radiusFrom`     | number | null           | Starting radius                                   |
| `radiusTo`       | number | null           | Ending radius                                     |

The component uses the following logic to determine the actual range:

1. `percentageFrom` defaults to 0 if `percentageTo` is set, otherwise uses `percentage`
2. `percentageTo` defaults to `percentage`
3. Both `radiusFrom` and `radiusTo` must be provided for the spiral to render

### `<Pointer>`

Visual indicator component that shows the current value of the knob. Supports different shapes and custom SVG elements.

#### Props

| Prop          | Type    | Default        | Required | Description                                          |
| ------------- | ------- | -------------- | -------- | ---------------------------------------------------- |
| `width`       | number  |                | Yes      | Width of the pointer                                 |
| `height`      | number  | width          | No       | Height of the pointer                                |
| `useRotation` | boolean | true           | No       | Use rotation transform instead of position transform |
| `type`        | string  |                | No       | Shape type: 'rect', 'circle', or 'triangle'          |
| `color`       | string  | 'currentColor' | No       | Fill color of the pointer                            |
| `radius`      | number  | size / 2       | No       | Distance from center to pointer                      |
| `center`      | number  | size / 2       | No       | Center point of rotation                             |
| `class`       | string  | ''             | No       | Additional CSS class                                 |
| `percentage`  | number  | context value  | No       | Percentage value to display                          |

#### Shape Types

- `rect`: Rectangular pointer centered on rotation point
- `circle`: Circular pointer with radius equal to width
- `triangle`: Triangular pointer pointing outward
- Custom: Provided via snippet that receives `{ width, height, percentage }`

#### Positioning

The pointer can be positioned in two ways, controlled by the `useRotation` prop:

- `true`: Rotates pointer around center point using a rotation transform
- `false`: Positions pointer at calculated x,y coordinates using a translation transform

Example with custom pointer:

```svelte
<Pointer width={10} height={20}>
	{#snippet pointer({ width, height, percentage })}
		<!-- Custom pointer implementation -->
		<rect x={-width * 0.5} {width} {height} fill="currentColor" />
	{/snippet}
</Pointer>
```

### `<Label>`

Displays text labels around the knob at specified angles. Labels are positioned in polar coordinates and automatically rotated to maintain readability.

#### Props

| Prop         | Type   | Default        | Required | Description                      |
| ------------ | ------ | -------------- | -------- | -------------------------------- |
| `label`      | string |                | Yes      | Text to display                  |
| `radius`     | number |                | Yes      | Distance from center             |
| `percentage` | number |                | Yes      | Position around the circle (0-1) |
| `center`     | number | size / 2       | No       | Center point                     |
| `color`      | string | 'currentColor' | No       | Text color                       |
| `class`      | string | ''             | No       | CSS class for the text element   |
| `userSelect` | string | 'none'         | No       | CSS user-select property value   |

### `<Scale>`

Renders a radial scale with configurable tick marks around the knob. Supports circle and rect tick shapes, or custom rendered ticks.

#### Props

| Prop          | Type   | Default        | Required | Description                                |
| ------------- | ------ | -------------- | -------- | ------------------------------------------ |
| `tickWidth`   | number |                | Yes      | Width of each tick                         |
| `tickHeight`  | number |                | Yes      | Height of each tick (for rect type)        |
| `type`        | string | 'rect'         | No       | Shape type: 'rect' or 'circle'             |
| `radius`      | number | size / 2       | No       | Distance from center to ticks              |
| `color`       | string | 'currentColor' | No       | Default tick color                         |
| `activeColor` | string | color          | No       | Color for active tick                      |
| `class`       | string | ''             | No       | Default tick class                         |
| `activeClass` | string | class          | No       | Class for active tick                      |
| `steps`       | number | 10             | No       | Number of ticks (falls back to knob steps) |

The scale can be customized using a snippet that receives:

```typescript
interface RenderCustomProps {
	tickWidth: number; // Width of tick
	tickHeight: number; // Height of tick
	translateX: number; // X position
	translateY: number; // Y position
	angleOffset: number; // Starting angle
	stepSize: number; // Angle between ticks
	center: number; // Center point
	color: string; // Default color
	className?: string; // Default class
	active: number; // Index of active tick
	activeColor: string; // Active tick color
	activeClassName: string; // Active tick class
	i: number; // Current tick index
	steps: number; // Total number of steps
	percentage: number; // Current percentage
}
```

Example with custom ticks:

```svelte
<Scale tickWidth={2} tickHeight={10}>
	{#snippet custom(props)}
		<!-- Custom tick implementation -->
		<rect
			class={[props.i === props.active ? props.activeClassName : props.className]}
			fill={props.i === props.active ? props.activeColor : props.color}
			stroke="none"
			width={props.tickWidth}
			height={props.tickHeight}
			transform={`
        rotate(${props.angleOffset + props.stepSize * props.i} ${props.center} ${props.center}) 
        translate(${props.translateX} ${props.translateY})
      `}
		/>
	{/snippet}
</Scale>
```

### `<Value>`

Displays the current value of the knob as text. Supports decimal places formatting and vertical positioning.

#### Props

| Prop           | Type   | Default        | Required | Description                    |
| -------------- | ------ | -------------- | -------- | ------------------------------ |
| `value`        | number | context value  | No       | Value to display               |
| `center`       | number | size / 2       | No       | Center point                   |
| `radius`       | number | size / 2       | No       | Distance from center           |
| `decimalPlace` | number | 0              | No       | Number of decimal places       |
| `marginBottom` | number | 0              | No       | Bottom margin in pixels        |
| `color`        | string | 'currentColor' | No       | Text color                     |
| `class`        | string | ''             | No       | CSS class for the text element |

The component automatically handles negative zero values by removing the negative sign.
