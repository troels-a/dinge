import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ItemProvider } from '../src/ItemProvider';

// Mock fetch
global.fetch = vi.fn();

describe('ItemProvider', () => {
  it('should render children', () => {
    const config = {
      book: '/api/books'
    };
    
    const { getByText } = render(
      <ItemProvider config={config}>
        <div>Test Content</div>
      </ItemProvider>
    );
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});
