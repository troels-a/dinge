# Dinge

Dinge (German for "things") is a CRUD-based framework for managing items in React apps. It works by providing a centralized context and store for item state management, with automatic caching and optimistic updates. The framework includes:

- Provider framework with `useItem` hook for seamless data access
- Store for efficient management of items with built-in caching
- Extendable config supporting multiple API patterns

## Installation

```bash
# Install from git (for now)
npm install git+https://github.com/yourusername/dinge.git
# or
yarn add git+https://github.com/yourusername/dinge.git

# When published to npm:
# npm install dinge
# yarn add dinge
```

## Quick Start

```jsx
import { ItemProvider, Item, useItem, useItemContext } from 'dinge';

const config = {
  book: '/api/books',
  author: '/api/authors'
};

function App() {
  return (
    <ItemProvider config={config}>
      <BookDetail id="123" />
    </ItemProvider>
  );
}

function BookDetail({ id }) {
  return (
    <Item type="book" id={id}>
      <BookContent />
    </Item>
  );
}

function BookContent() {
  const { data, loading, error, update, remove } = useItem();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.title}</h1>
      <button onClick={() => update({ title: 'New Title' })}>
        Update Title
      </button>
      <button onClick={remove}>Delete</button>
    </div>
  );
}
```

## Configuration

The ItemProvider supports flexible configuration options for different API patterns.

### Option 1 - Simple Endpoint String

The simplest configuration assumes your endpoint supports all CRUD operations following REST conventions:

```jsx
const config = {
  book: '/api/books'
};
```

**Behavior:**
- **Create:** `POST /api/books`
- **Read:** `GET /api/books/:id`
- **Update:** `PUT /api/books/:id`
- **Delete:** `DELETE /api/books/:id`
- Response data is used as-is from the JSON body
- **Store:** Enabled by default (`store: true`)
- **TTL:** No expiration (`ttl: undefined`)

### Option 2 - Item Config Object

For more control over individual operations and caching behavior, use a configuration object:

```jsx
const config = {
  book: {
    store: true,        // Enable store caching (default: true)
    ttl: 300000,        // Cache time-to-live in ms (default: undefined - no expiration)
    
    create: {
      endpoint: '/api/books',
      method: 'POST',
      handler: res => res.json().then(data => data.book)
    },
    read: '/api/books',
    update: {
      endpoint: '/api/books',
      method: 'PATCH',
      handler: res => res.json()
    },
    delete: {
      endpoint: '/api/books',
      handler: res => res.ok ? { deleted: true } : { deleted: false }
    }
  }
};
```

**Configuration Options:**

**Top-level Item Config:**
- `store` (boolean, optional): Enable store caching for this item type (default: `true`)
- `ttl` (number, optional): Cache time-to-live in milliseconds. When set, cached items expire after this duration. When `undefined` (default), items never expire but are refreshed after CRUD operations.

**Operation Config:**

Each operation (`create`, `read`, `update`, `delete`) can be:
- A **string** (endpoint URL) - uses default HTTP method and response handling
- An **object** with the following properties:
  - `endpoint` (string, required): API endpoint URL
  - `method` (string, optional): HTTP method (defaults: POST for create, GET for read, PUT for update, DELETE for delete)
  - `handler` (function, optional): Custom response handler `(response) => data`
  - `headers` (object, optional): Additional HTTP headers
  - `transform` (function, optional): Transform request data before sending `(data) => transformedData`

### Mixed Configuration Styles

Configuration styles can be mixed at both the item and operation level:

```jsx
const config = {
  // Simple string config - uses store defaults
  author: '/api/authors',
  
  // Custom store config with mixed operations
  book: {
    store: true,
    ttl: 600000, // 10 minute cache
    create: {
      endpoint: '/api/books',
      handler: res => res.json().then(data => data.book)
    },
    read: '/api/books',
    update: '/api/books',
    delete: {
      endpoint: '/api/books',
      method: 'DELETE',
      handler: res => ({ success: res.ok })
    }
  },
  
  // Disable store for real-time data
  notification: {
    store: false,
    read: '/api/notifications'
  }
};
```

## Store Behavior

When `store: true` (default), ItemProvider automatically:

1. **Caches items** after fetch operations
2. **Maintains clean state**: Keeps a "clean" copy of data from the last successful API fetch for automatic rollback
3. **Auto-refreshes** the store after CRUD operations:
   - After `create`: Newly created item is added to store
   - After `update`: Updated item replaces cached version and becomes the new clean state
   - After `delete`: Item is removed from store
4. **Serves cached data** on subsequent reads (if within TTL when set)
5. **Shares state** across all components using the same item

### Clean State & Automatic Rollback

The framework tracks two versions of your data:
- **Current state** (`data`): The working copy that can be modified with `mutate`
- **Clean state**: The last successfully fetched/updated version from the API

When `update()` is called without arguments, it sends the current state to the API. If the API call fails, the current state automatically rolls back to the clean state.

### TTL (Time-To-Live) Options

- **`ttl: undefined`** (default): Items never expire but stay in sync via CRUD operations
- **`ttl: 300000`** (5 minutes): Items expire after 5 minutes and are refetched
- **`ttl: 0`**: Items are cached but always revalidated on access

## API Reference

### `<ItemProvider>`

The root provider component that manages item state.

**Props:**
- `config` (object, required): Configuration object mapping item types to endpoints/configs

### `<Item>`

Wrapper component that loads and provides item data to children.

**Props:**
- `type` (string, required): Item type as defined in config
- `id` (string|number, required): Unique identifier for the item
- `fallback` (ReactNode, optional): Loading fallback component

### `useItem()`

Hook to access item data and operations within an `<Item>` component.

**Returns:**
```typescript
{
  data: any;              // Item data
  loading: boolean;       // Loading state
  error: Error | null;    // Error object if request failed
  
  // CRUD operations
  update: (
    updates?: Partial<Data>,
    options?: { rollback?: boolean }
  ) => Promise<Data>;  // Sync with API (optional auto-rollback)
  remove: () => Promise<void>;                          // Delete item via API
  refresh: () => Promise<Data>;                         // Refetch item from API
  
  // Direct store manipulation
  mutate: (updater: (prev: Data) => Data) => void;   // Update item in store only
}
```

**`mutate` Function:**

The `mutate` function allows you to directly manipulate the current item state in the store without making an API call. This is useful for building up changes before syncing with the server.

```jsx
const { mutate } = useItem();

// Update current state (no API call)
mutate(prev => ({
  ...prev,
  title: 'New Title'
}));
```

**Note:** Changes made with `mutate` are temporary until synchronized with `update()`.

**`update` Function:**

The `update` function synchronizes the current state with the API. It can be called with or without arguments, and supports automatic rollback on failure:

```jsx
const { update } = useItem();

// Option 1: Send current state (accumulated via mutate calls)
await update();

// Option 2: Send current state with auto-rollback on failure
await update(undefined, { rollback: true });

// Option 3: Send specific updates (bypasses mutate changes)
await update({ title: 'New Title' });

// Option 4: Send specific updates with auto-rollback
await update({ title: 'New Title' }, { rollback: true });
```

When `rollback: true` is set, the state automatically reverts to the last clean version if the API call fails.

## Examples

### Creating a New Item

```jsx
import { useItemContext } from 'dinge';

function CreateBook() {
  const { create } = useItemContext('book');
  
  const handleCreate = async () => {
    const newBook = await create({
      title: 'New Book',
      author: 'John Doe'
    });
    console.log('Created:', newBook);
    // Item is automatically added to store
  };
  
  return <button onClick={handleCreate}>Create Book</button>;
}
```

### Optimistic Updates with Optional Rollback

```jsx
function BookEditor() {
  const { data, mutate, update } = useItem();
  
  const handleChange = (e) => {
    // Update current state immediately
    mutate(prev => ({ ...prev, title: e.target.value }));
  };
  
  const handleSave = async () => {
    try {
      // Sync current state with API
      await update();
    } catch (error) {
      console.error('Save failed:', error);
      // Handle error manually if needed
    }
  };
  
  return (
    <div>
      <input value={data.title} onChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Local-Only Updates

```jsx
function BookNotes() {
  const { data, mutate } = useItem();
  
  // Update local notes without API call
  const updateLocalNotes = (notes) => {
    mutate(prev => ({
      ...prev,
      localNotes: notes  // This won't be sent to API unless update() is called
    }));
  };
  
  return (
    <textarea
      value={data.localNotes || ''}
      onChange={(e) => updateLocalNotes(e.target.value)}
      placeholder="Local notes (not saved to server)"
    />
  );
}
```

### Using TTL for Fresh Data

```jsx
const config = {
  stockPrice: {
    store: true,
    ttl: 60000, // Refresh every minute
    read: '/api/stocks'
  },
  userProfile: {
    store: true,
    ttl: undefined, // Cache indefinitely, update via CRUD
    read: '/api/user/profile'
  }
};
```

### Disabling Store for Real-Time Data

```jsx
const config = {
  liveChat: {
    store: false,  // Don't cache - always fetch fresh
    read: '/api/chat/messages'
  }
};
```

### Custom Error Handling

```jsx
function BookDetail() {
  const { data, error, refresh } = useItem();
  
  if (error) {
    return (
      <div>
        <p>Failed to load: {error.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }
  
  return <div>{data.title}</div>;
}
```

### Complex Optimistic Updates

```jsx
function BookmarkButton() {
  const { data, mutate, update } = useItem();
  
  const toggleBookmark = async () => {
    // Optimistically update UI
    mutate(prev => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
      bookmarkCount: prev.bookmarkCount + (prev.isBookmarked ? -1 : 1)
    }));
    
    try {
      // Sync with server with automatic rollback
      await update(undefined, { rollback: true });
    } catch (error) {
      console.error('Bookmark update failed:', error);
      // State automatically rolled back to clean version
    }
  };
  
  return (
    <button onClick={toggleBookmark}>
      {data.isBookmarked ? '★' : '☆'} {data.bookmarkCount}
    </button>
  );
}
```

### Direct Updates (Bypass mutate)

```jsx
function QuickStatusChange() {
  const { update } = useItem();
  
  // Update specific fields without modifying current state first
  const changeStatus = async (newStatus) => {
    try {
      await update({ status: newStatus });
    } catch (error) {
      console.error('Status change failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={() => changeStatus('published')}>Publish</button>
      <button onClick={() => changeStatus('draft')}>Save as Draft</button>
    </div>
  );
}
```

### Batch Updates

```jsx
function BulkEditor() {
  const { data, mutate, update } = useItem();
  
  const applyBulkChanges = async () => {
    // Build up multiple changes
    mutate(prev => ({
      ...prev,
      status: 'published',
      featured: true,
      priority: 'high',
      lastModified: new Date().toISOString()
    }));
    
    try {
      // Send all accumulated changes at once with rollback
      await update(undefined, { rollback: true });
    } catch (error) {
      console.error('Bulk update failed - rolled back');
    }
  };
  
  return (
    <button onClick={applyBulkChanges}>
      Apply All Changes
    </button>
  );
}
```

### Checking for Unsaved Changes

```jsx
function EditorWithDirtyCheck() {
  const { data, mutate, update } = useItem();
  const [isDirty, setIsDirty] = useState(false);
  
  const handleChange = (field, value) => {
    mutate(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };
  
  const handleSave = async () => {
    try {
      await update();
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };
  
  return (
    <div>
      <input
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
      />
      <button onClick={handleSave} disabled={!isDirty}>
        Save {isDirty && '*'}
      </button>
    </div>
  );
}
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.