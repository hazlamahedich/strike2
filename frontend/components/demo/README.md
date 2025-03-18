# Multiple Active Dialog System

This implementation demonstrates a solution for managing multiple dialogs that can remain active and interactive simultaneously, addressing the limitations of the standard Radix UI Dialog component.

## Key Features

- Multiple dialogs can be open and interactive at the same time
- Child dialogs can be opened from parent dialogs without deactivating the parent
- Proper z-index management for dialog stacking
- Visual indicators for active vs. inactive dialogs
- Full keyboard accessibility
- Focus management between dialogs

## Implementation Components

### 1. `ImprovedDialogContext.tsx`

This context provider manages the state of all open dialogs, with functions to:
- Open new dialogs
- Close existing dialogs
- Focus a specific dialog
- Check if a dialog is open
- Get dialog z-index
- Get dialog data

### 2. `improved-dialog.tsx`

This file contains all dialog components:
- `ImprovedDialogRoot`: The root dialog component that manages open/close state
- `ImprovedDialogContent`: The main dialog content area with focus management
- `ImprovedDialogHeader/Footer/Title/Description`: Convenience UI components
- `ImprovedDialogContainer`: Component that renders all active dialogs

### 3. Demo Files

- `SimpleMeetingDetails.tsx`: Simplified meeting details component that opens secondary dialogs
- `MultiDialogDemo.tsx`: Main demo page showing multiple dialog functionality
- `app/demo/multi-dialog/page.tsx`: Next.js page file to display the demo

## How to Use

1. Wrap your application (or the part that needs multiple dialogs) with `ImprovedDialogProvider`:

```tsx
<ImprovedDialogProvider>
  <YourApp />
</ImprovedDialogProvider>
```

2. Create and open dialogs imperatively using the `useImprovedDialog` hook:

```tsx
const { openDialog, closeDialog } = useImprovedDialog();

// Open a dialog
openDialog('unique-dialog-id', 
  <ImprovedDialogContent dialogId="unique-dialog-id">
    Your dialog content here
  </ImprovedDialogContent>
);

// Close a dialog
closeDialog('unique-dialog-id');
```

3. Include the `ImprovedDialogContainer` component in your layout to render all active dialogs:

```tsx
<ImprovedDialogContainer />
```

## Best Practices

1. Always use a unique ID for each dialog
2. Keep child dialogs relatively small to avoid UI crowding
3. Use visual cues to indicate active vs. inactive dialogs
4. Properly clean up dialogs when components unmount
5. Consider z-index carefully for complex layouts

## Advantages Over Standard Dialog

1. Multiple dialogs can remain active unlike standard Radix/shadcn dialogs
2. Better control over open/close behavior
3. Improved modal stacking management
4. More flexibility for complex application workflows
5. State management handled by React Context

## Demo

View the live demo at `/demo/multi-dialog` to see the implementation in action. 