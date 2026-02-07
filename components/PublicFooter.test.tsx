import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PublicFooter from './PublicFooter';

describe('PublicFooter', () => {
  it('renders the logo', () => {
    render(<PublicFooter />);
    expect(screen.getByAltText('Умняут')).toBeInTheDocument();
  });

  it('renders the project name', () => {
    render(<PublicFooter />);
    expect(screen.getByText('Умняут')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<PublicFooter />);
    const aboutLink = screen.getByText('О проекте');
    const contactsLink = screen.getByText('Контакты');
    const privacyLink = screen.getByText('Политика');

    expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');
    expect(contactsLink.closest('a')).toHaveAttribute('href', '/contacts');
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('does not render a blog link', () => {
    render(<PublicFooter />);
    expect(screen.queryByText('Блог')).not.toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<PublicFooter />);
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
