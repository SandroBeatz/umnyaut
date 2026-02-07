import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('should render logo and title', () => {
    render(<Header />);
    expect(screen.getByText('Умняут')).toBeInTheDocument();
    expect(screen.getByAltText('Умняут')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Игры')).toBeInTheDocument();
    expect(screen.getByText('О проекте')).toBeInTheDocument();
    expect(screen.getByText('Блог')).toBeInTheDocument();
    expect(screen.getByText('Контакты')).toBeInTheDocument();
  });

  it('should render login button', () => {
    render(<Header />);
    const loginButtons = screen.getAllByText('Войти');
    expect(loginButtons.length).toBeGreaterThan(0);
  });

  it('should have correct href attributes for navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Игры').closest('a')).toHaveAttribute('href', '/game');
    expect(screen.getByText('О проекте').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('Блог').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('Контакты').closest('a')).toHaveAttribute('href', '/contact');
  });

  it('should have login button linking to onboarding', () => {
    render(<Header />);
    const loginButtons = screen.getAllByText('Войти');
    loginButtons.forEach((btn) => {
      expect(btn.closest('a')).toHaveAttribute('href', '/onboarding');
    });
  });

  it('should have a mobile menu toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Открыть меню')).toBeInTheDocument();
  });

  it('should toggle mobile menu on button click', () => {
    render(<Header />);
    const toggle = screen.getByLabelText('Открыть меню');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('Закрыть меню')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Мобильная навигация' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Закрыть меню'));
    expect(screen.getByLabelText('Открыть меню')).toBeInTheDocument();
  });
});
