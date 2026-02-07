import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardFooter from './DashboardFooter';

describe('DashboardFooter', () => {
  it('renders copyright text', () => {
    render(<DashboardFooter />);
    expect(screen.getByText(/Умняут/)).toBeInTheDocument();
    expect(screen.getByText(/Все права защищены/)).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<DashboardFooter />);
    expect(screen.getByText('О нас').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('Контакты').closest('a')).toHaveAttribute('href', '/contacts');
    expect(screen.getByText('Политика конфиденциальности').closest('a')).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('renders social media links', () => {
    render(<DashboardFooter />);
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('does not render a logo image', () => {
    render(<DashboardFooter />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
