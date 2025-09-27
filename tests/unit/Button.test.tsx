import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Button from '../../components/ui/Button';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Button Component', () => {
  test('renders button with text', () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    
    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click me</Button>
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies disabled state', () => {
    render(
      <TestWrapper>
        <Button disabled>Disabled button</Button>
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  test('applies different variants', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
      </TestWrapper>
    );

    let button = screen.getByRole('button', { name: /primary/i });
    expect(button).toHaveClass('bg-slate-800');

    rerender(
      <TestWrapper>
        <Button variant="secondary">Secondary</Button>
      </TestWrapper>
    );

    button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-slate-200');
  });

  test('applies custom className', () => {
    render(
      <TestWrapper>
        <Button className="custom-class">Custom button</Button>
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });
});
