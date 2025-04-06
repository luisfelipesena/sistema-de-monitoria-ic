import React from 'react';
import { describe, expect, it } from 'vitest';

// Simple Button component
function Button({ children }: { children: React.ReactNode }) {
  return <button className="text-white bg-blue-500">{children}</button>;
}

describe('Button Component', () => {
  // Test component rendering by validating JSX output
  it('should render with correct props and content', () => {
    // Create component element
    const element = <Button>Click me</Button>;

    // Assertions about the JSX element
    expect(element.type).toBe(Button);
    expect(element.props.children).toBe('Click me');
  });

  // Validate component properties
  it('should have the expected component structure', () => {
    // Create a button instance - this won't render to DOM
    const btn = Button({ children: 'Test' });

    // Check type and props of returned JSX
    expect(btn.type).toBe('button');
    expect(btn.props.className).toContain('bg-blue-500');
    expect(btn.props.className).toContain('text-white');
    expect(btn.props.children).toBe('Test');
  });
});
