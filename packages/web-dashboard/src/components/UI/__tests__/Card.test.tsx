import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('card', 'card-padding-md');
    });

    it('renders with different padding sizes', () => {
      const { rerender } = render(<Card padding="none">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('card-padding-none');

      rerender(<Card padding="sm">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('card-padding-sm');

      rerender(<Card padding="lg">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('card-padding-lg');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('renders header content', () => {
      render(<CardHeader>Header content</CardHeader>);
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('card-header');
    });
  });

  describe('CardContent', () => {
    it('renders content', () => {
      render(<CardContent>Main content</CardContent>);
      const content = screen.getByText('Main content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('card-content');
    });
  });

  describe('CardFooter', () => {
    it('renders footer content', () => {
      render(<CardFooter>Footer content</CardFooter>);
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('card-footer');
    });
  });

  describe('Complete Card', () => {
    it('renders all sections together', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });
});