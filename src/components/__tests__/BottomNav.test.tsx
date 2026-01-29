import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomNav from '../BottomNav';

describe('BottomNav Component', () => {
  it('renders all navigation buttons', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="DASHBOARD" 
        onViewChange={mockOnViewChange} 
      />
    );

    // Check if all three buttons are rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('calls onViewChange with correct view when dashboard button is clicked', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="SETTINGS" 
        onViewChange={mockOnViewChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // First button is Dashboard

    expect(mockOnViewChange).toHaveBeenCalledWith('DASHBOARD');
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it('calls onViewChange with correct view when game button is clicked', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="DASHBOARD" 
        onViewChange={mockOnViewChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Second button is Game

    expect(mockOnViewChange).toHaveBeenCalledWith('GAME');
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it('calls onViewChange with correct view when settings button is clicked', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="DASHBOARD" 
        onViewChange={mockOnViewChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // Third button is Settings

    expect(mockOnViewChange).toHaveBeenCalledWith('SETTINGS');
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it('applies active styles to the dashboard button when activeView is DASHBOARD', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="DASHBOARD" 
        onViewChange={mockOnViewChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass('bg-indigo-600');
  });

  it('applies active styles to the settings button when activeView is SETTINGS', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <BottomNav 
        activeView="SETTINGS" 
        onViewChange={mockOnViewChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[2]).toHaveClass('bg-indigo-600');
  });
});
