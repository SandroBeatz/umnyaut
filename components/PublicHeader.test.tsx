import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PublicHeader from './PublicHeader';

// Mock useAppContext
vi.mock('@/app/AppContext', () => ({
  useAppContext: vi.fn(),
}));

import { useAppContext } from '@/app/AppContext';
const mockUseAppContext = vi.mocked(useAppContext);

describe('PublicHeader', () => {
  describe('unauthenticated', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        profile: null,
        setProfile: vi.fn(),
        saveProfile: vi.fn(),
        loading: false,
      });
    });

    it('renders the logo', () => {
      render(<PublicHeader />);
      expect(screen.getByAltText('Умняут')).toBeInTheDocument();
    });

    it('renders navigation links with correct hrefs', () => {
      render(<PublicHeader />);
      const gamesLink = screen.getAllByText('Игры')[0];
      const aboutLink = screen.getAllByText('О проекте')[0];
      const contactsLink = screen.getAllByText('Контакты')[0];

      expect(gamesLink.closest('a')).toHaveAttribute('href', '/games');
      expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');
      expect(contactsLink.closest('a')).toHaveAttribute('href', '/contacts');
    });

    it('renders login button linking to /auth/onboarding', () => {
      render(<PublicHeader />);
      const loginButtons = screen.getAllByText('Войти');
      expect(loginButtons[0].closest('a')).toHaveAttribute('href', '/auth/onboarding');
    });

    it('toggles mobile menu', () => {
      render(<PublicHeader />);
      const menuButton = screen.getByLabelText('Открыть меню');
      fireEvent.click(menuButton);
      expect(screen.getByLabelText('Мобильная навигация')).toBeInTheDocument();
    });
  });

  describe('authenticated', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        profile: {
          username: 'TestUser',
          selectedCategories: [],
          stats: { points: 0, level: 1, streak: 0, lastPlayed: null, totalSolved: 0 },
          history: [],
          solvedCrosswordIds: [],
          themeProgress: {},
        },
        setProfile: vi.fn(),
        saveProfile: vi.fn(),
        loading: false,
      });
    });

    it('does not render login button', () => {
      render(<PublicHeader />);
      expect(screen.queryByText('Войти')).not.toBeInTheDocument();
    });

    it('renders profile button and shows dropdown on click', () => {
      render(<PublicHeader />);
      // Find the profile avatar button (User icon button)
      const avatarButtons = screen.getAllByRole('button');
      const profileButton = avatarButtons.find(
        (btn) => btn.className.includes('rounded-xl') && btn.className.includes('bg-stone-800')
      );
      expect(profileButton).toBeTruthy();

      fireEvent.click(profileButton!);
      expect(screen.getByText('Дашборд')).toBeInTheDocument();
      expect(screen.getByText('Настройки')).toBeInTheDocument();
      expect(screen.getByText('Выйти')).toBeInTheDocument();
    });

    it('dropdown links have correct hrefs', () => {
      render(<PublicHeader />);
      const avatarButtons = screen.getAllByRole('button');
      const profileButton = avatarButtons.find(
        (btn) => btn.className.includes('rounded-xl') && btn.className.includes('bg-stone-800')
      );
      fireEvent.click(profileButton!);

      expect(screen.getByText('Дашборд').closest('a')).toHaveAttribute('href', '/p/dashboard');
      expect(screen.getByText('Настройки').closest('a')).toHaveAttribute('href', '/p/settings');
      expect(screen.getByText('Выйти').closest('a')).toHaveAttribute('href', '/auth/logout');
    });
  });
});
