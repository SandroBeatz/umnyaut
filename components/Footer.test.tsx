import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('should render logo and title', () => {
    render(<Footer />);
    expect(screen.getByText('Умняут')).toBeInTheDocument();
    expect(screen.getByAltText('Умняут')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Footer />);
    expect(screen.getByText('О проекте')).toBeInTheDocument();
    expect(screen.getByText('Блог')).toBeInTheDocument();
    expect(screen.getByText('Контакты')).toBeInTheDocument();
    expect(screen.getByText('Политика')).toBeInTheDocument();
  });

  it('should render social media links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should render copyright text', () => {
    render(<Footer />);
    expect(screen.getByText('© 2025 «Умняут». Все права защищены')).toBeInTheDocument();
  });

  it('should have correct href attributes for navigation links', () => {
    render(<Footer />);
    expect(screen.getByText('О проекте').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('Блог').closest('a')).toHaveAttribute('href', '/blog');
    expect(screen.getByText('Контакты').closest('a')).toHaveAttribute('href', '/contact');
    expect(screen.getByText('Политика').closest('a')).toHaveAttribute('href', '/policy');
  });

  it('should have correct href attributes for social media links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', 'https://facebook.com');
    expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://instagram.com');
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com');
    expect(screen.getByLabelText('Email')).toHaveAttribute('href', 'mailto:info@umnyaut.ru');
  });
});
