import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Route } from './index'; // Import the Route object

// Extract the component from the Route configuration
const LandingPageComponent = Route.options.component;

if (!LandingPageComponent) {
  throw new Error(
    'LandingPageComponent is not defined on the route configuration.',
  );
}

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
}));

// Mock the router context if necessary (for simple render, might not be needed)
// If components use Link or other router features, more setup is required.

describe('LandingPageComponent', () => {
  it('renders the main heading', () => {
    render(<LandingPageComponent />);
    const heading = screen.getByRole('heading', {
      name: /Gerencie seu Programa de Monitoria/i,
      level: 1, // Ensure it's the h1
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the login button when not authenticated', () => {
    render(<LandingPageComponent />);
    const loginButtons = screen.getAllByRole('button', {
      name: /Entrar com Email UFBA/i,
    });
    // Expecting two buttons with this text based on the component structure
    expect(loginButtons).toHaveLength(2);
    expect(loginButtons[0]).toBeInTheDocument();
    expect(loginButtons[1]).toBeInTheDocument();
  });

  it('renders the "Como Funciona" section', () => {
    render(<LandingPageComponent />);
    const sectionHeading = screen.getByRole('heading', {
      name: /Como Funciona/i,
      level: 2,
    });
    expect(sectionHeading).toBeInTheDocument();
  });
});
