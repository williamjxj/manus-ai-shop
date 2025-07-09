# Loading States Reference

## Overview

This document provides a technical reference for the loading state components and patterns implemented across the application.

## 🔧 Components

### LoadingLink Component

**File**: `src/components/LoadingLink.tsx`

#### Purpose

Provides navigation with loading feedback for better UX.

#### Props

```typescript
interface LoadingLinkProps {
  href: string // Navigation destination
  children: ReactNode // Button content
  className?: string // Additional CSS classes
  loadingText?: string // Text shown during loading
  onClick?: () => void // Optional click handler
}
```

#### Usage

```tsx
<LoadingLink
  href='/products/123'
  className='btn-primary'
  loadingText='Loading...'
>
  <Eye className='mr-1 h-4 w-4' />
  Details
</LoadingLink>
```

#### Features

- Automatic loading state management
- Router navigation with Next.js
- Disabled state during loading
- Customizable loading text
- Maintains original styling

### AddToCartButton Component

**File**: `src/components/AddToCartButton.tsx`

#### Purpose

Handles cart operations with comprehensive loading and feedback states.

#### Props

```typescript
interface AddToCartButtonProps {
  productId: string // Product to add to cart
  className?: string // Additional CSS classes
  size?: 'sm' | 'md' | 'lg' // Button size variant
  variant?: 'primary' | 'secondary' // Style variant
}
```

#### Usage

```tsx
<AddToCartButton
  productId='product-123'
  size='lg'
  variant='primary'
  className='w-full'
/>
```

#### Features

- Cart context integration
- Toast notifications for feedback
- Size and style variants
- Loading state management
- Error handling

## 🎨 Design Patterns

### Loading Spinner

Standard spinner used across all components:

```tsx
<div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
```

### Button States

```css
/* Normal state */
.btn {
  opacity: 1;
  cursor: pointer;
}

/* Loading state */
.btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}
```

### Loading Text Patterns

- **Navigation**: "Loading..."
- **Cart operations**: "Adding to Cart..."
- **Form submissions**: "Saving..."
- **Data fetching**: "Loading data..."

## 🔄 State Management

### Loading State Flow

1. **Initial**: Button ready for interaction
2. **Loading**: Spinner shown, button disabled
3. **Success**: Action completed, feedback shown
4. **Error**: Error message displayed
5. **Reset**: Return to initial state

### Error Handling

```typescript
try {
  setIsLoading(true)
  await performAction()
  toast.success('Success message')
} catch (error) {
  toast.error('Error: ' + error.message)
} finally {
  setIsLoading(false)
}
```

## 📱 Responsive Considerations

### Mobile Optimizations

- Touch-friendly button sizes (minimum 44px)
- Appropriate spinner sizes for mobile
- Readable loading text on small screens
- Proper touch feedback

### Accessibility

- ARIA labels for screen readers
- Proper disabled states
- Keyboard navigation support
- Focus management

## 🎯 Best Practices

### Implementation Guidelines

1. **Always provide feedback** for user actions
2. **Use consistent loading patterns** across components
3. **Handle errors gracefully** with user-friendly messages
4. **Prevent duplicate actions** with disabled states
5. **Maintain visual hierarchy** during loading states

### Performance Tips

- Debounce rapid clicks
- Use React.memo for expensive components
- Optimize re-renders with useCallback
- Clean up async operations on unmount

## 🔍 Testing

### Test Cases

- Loading state activation
- Error handling
- Success feedback
- Disabled state behavior
- Keyboard navigation
- Mobile touch interactions

### Manual Testing Checklist

- [ ] Loading spinner appears immediately
- [ ] Button becomes disabled during loading
- [ ] Success/error messages display correctly
- [ ] Multiple clicks are prevented
- [ ] Loading state clears on completion
- [ ] Keyboard navigation works
- [ ] Mobile touch feedback is responsive

## 🚀 Future Enhancements

### Potential Improvements

- **Progress indicators** for long operations
- **Skeleton loading** for complex components
- **Optimistic updates** for better perceived performance
- **Retry mechanisms** for failed operations
- **Loading state persistence** across navigation

### Advanced Patterns

- Global loading state management
- Concurrent loading states
- Priority-based loading queues
- Smart loading state aggregation

## 📚 Related Documentation

- [UI Enhancements Summary](./ui-enhancements-summary.md)
- [Component Architecture](./component-architecture.md)
- [User Experience Guidelines](./ux-guidelines.md)
