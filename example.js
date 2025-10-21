// Example usage of Dinge library
import { ItemProvider, Item, useItem } from './dist/index.mjs';

// Mock API responses
global.fetch = (url) => {
  if (url.includes('/api/books/123')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: '123', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' })
    });
  }
  return Promise.reject(new Error('Not found'));
};

const config = {
  book: '/api/books'
};

function BookContent() {
  const { data, loading, error, update, remove } = useItem();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data?.title}</h1>
      <p>Author: {data?.author}</p>
      <button onClick={() => update({ title: 'New Title' })}>
        Update Title
      </button>
      <button onClick={remove}>Delete</button>
    </div>
  );
}

function App() {
  return (
    <ItemProvider config={config}>
      <Item type="book" id="123">
        <BookContent />
      </Item>
    </ItemProvider>
  );
}

console.log('Dinge library example created successfully!');
console.log('The library is ready to use with the following components:');
console.log('- ItemProvider: Main context provider');
console.log('- Item: Wrapper component for individual items');
console.log('- useItem: Hook for accessing item data and operations');
console.log('- useItemContext: Hook for creating new items');
