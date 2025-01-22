# svelte-knob TODO List

## High Priority

### Component Logic Extraction

Current state: Most logic lives in component files (e.g., `Knob.svelte`, `Pointer.svelte`).

- [ ] Move angle calculations to dedicated files:

  - Create `src/lib/utils/angles.ts` for shared angle math
  - Move from `utils.ts` and component files
  - Example functions: `calculateAngleFromPercentage`, `normalizeAngle`

- [ ] Extract pointer position logic:

  - Create `src/lib/hooks/usePointer.ts`
  - Move transform calculations from `Pointer.svelte`
  - Reusable hook for both rotation and position modes

- [ ] Separate scale calculations:
  - Create `src/lib/hooks/useScale.ts`
  - Move tick generation logic from `Scale.svelte`
  - Make step calculations reusable

### Accessibility Improvements

Current state: Basic ARIA support in `Knob.svelte`, keyboard navigation in `actions/events.ts`.

- [ ] Enhance keyboard handling in `actions/events.ts`:

  ```typescript
  // Add to handleKeyDown
  if (e.shiftKey) {
  	stepSize *= 5; // Larger steps with shift
  }
  if (e.ctrlKey) {
  	stepSize *= 0.2; // Finer control with ctrl
  }
  ```

- [ ] Add screen reader messages in `Knob.svelte`:

  ```typescript
  // Add to state updates
  const ariaMessage = $derived(`Value ${state.value}${state.isActive ? ', adjusting' : ''}`);
  ```

- [ ] Improve focus styles:

  - Add to `Knob.svelte`:

  ```svelte
  <div
    class={`knob-focus-ring ${state.isActive ? 'active' : ''}`}
    style="outline: none; {focused ? 'box-shadow: 0 0 0 2px var(--focus-color, #4299e1);' : ''}"
  >
  ```

### State Management Optimizations

Current state: State management in `stores/knob.svelte.ts`, updates in components.

- [ ] Batch value updates in `stores/knob.svelte.ts`:

  ```typescript
  function updateValue(newValue: number) {
  	batch(() => {
  		state.value = newValue;
  		state.percentage = calculatePercentage(newValue);
  	});
  }
  ```

- [ ] Add snap-to-grid improvements:

  - Enhance `utils.ts` with better snapping:

    ```typescript
    export function snapToGrid(value: number, steps: number): number {
    	const stepSize = 1 / (steps - 1);
    	return Math.round(value / stepSize) * stepSize;
    }
    ```

## Medium Priority

### Testing Setup

Current state: No tests yet.

- [ ] Add basic test setup:

  - Create `tests/` directory
  - Add Vitest configuration
  - Start with utility function tests:

  ```typescript
  // tests/utils.test.ts
  import { describe, it, expect } from 'vitest';
  import { calculateAngle } from '../src/lib/utils';

  describe('calculateAngle', () => {
  	it('converts percentage to angle correctly', () => {
  		expect(calculateAngle(0.5, 360)).toBe(180);
  	});
  });
  ```

- [ ] Add component testing:

  - Create `tests/components/`
  - Start with Knob.svelte tests:

  ```typescript
  // tests/components/Knob.test.ts
  import { render, fireEvent } from '@testing-library/svelte';
  import Knob from '../../src/lib/components/Knob.svelte';

  test('updates value on arrow keys', async () => {
  	const { component } = render(Knob, { props: { min: 0, max: 100 } });
  	await fireEvent.keyDown(component, { key: 'ArrowRight' });
  	expect(component.value).toBe(1);
  });
  ```

### Performance Improvements

Current state: Basic SVG rendering, some calculations could be optimized.

- [ ] Optimize path calculations in `Range.svelte`:

  ```typescript
  // Memoize path calculation
  const pathD = $derived.by(() => {
  	if (!percentage) return '';
  	return calculateArcPath(percentage, radius, arcWidth);
  });
  ```

- [ ] Add touch event optimization in `actions/events.ts`:\

  ```typescript
  // Add touch event debouncing
  let touchTimeout: number;
  function handleTouch(e: TouchEvent) {
  	if (touchTimeout) clearTimeout(touchTimeout);
  	touchTimeout = setTimeout(() => {
  		// Handle touch event
  	}, 16); // ~60fps
  }
  ```

### Developer Tools

Current state: Basic console logging.

- [ ] Add development logging:

  - Create `src/lib/utils/debug.ts`:

  ```typescript
  const DEBUG = process.env.NODE_ENV === 'development';
  export function debugLog(component: string, ...args: any[]) {
  	if (DEBUG) console.log(`[${component}]`, ...args);
  }
  ```

- [ ] Add value validation in `stores/knob.svelte.ts`:

  ```typescript
  function validateValue(value: number) {
  	if (process.env.NODE_ENV === 'development') {
  		if (value < min || value > max) {
  			console.warn(`Value ${value} outside range [${min}, ${max}]`);
  		}
  	}
  }
  ```

## Lower Priority

### Documentation Improvements

Current state: Good README, could use more examples.

- [ ] Add usage examples:

  - Create `examples/` directory
  - Add common use cases:

  ```svelte
  <!-- examples/VolumeKnob.svelte -->
  <Knob min={0} max={100} size={100}>
  	<Arc arcWidth={4} />
  	<Pointer type="triangle" width={2} height={8} />
  	<Value />
  </Knob>
  ```

### Nice to Have Features

Current state: Basic shapes and styles.

- [ ] Add transition support:

  ```typescript
  // Add to Pointer.svelte
  import { tweened } from 'svelte/motion';
  const rotation = tweened(0, { duration: 150 });
  ```

- [ ] Add custom pointer shapes:

  ```svelte
  <!-- In Pointer.svelte -->
  {#if type === 'diamond'}
  	<path
  		d={`M 0,${-height / 2} L ${width / 2},0 L 0,${height / 2} L ${-width / 2},0 Z`}
  		fill={color}
  		class={className}
  	/>
  {/if}
  ```
