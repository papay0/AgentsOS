// Quick test script to isolate the updateWindow issue
import { useWindowStore } from './app/home/stores/windowStore.js'

// Reset store
useWindowStore.setState({
  windows: [],
  nextZIndex: 10,
  activeWindowId: null,
})

// Add a window
const windowData = {
  type: 'vscode',
  title: 'Test Window',
  position: { x: 0, y: 0 },
  size: { width: 400, height: 300 },
  minimized: false,
  maximized: false,
  focused: true,
}

useWindowStore.getState().addWindow(windowData)

console.log('After addWindow:', JSON.stringify(useWindowStore.getState().windows, null, 2))

const windowId = useWindowStore.getState().windows[0].id

// Try updateWindow
useWindowStore.getState().updateWindow(windowId, {
  title: 'Updated Title',
})

console.log('After updateWindow:', JSON.stringify(useWindowStore.getState().windows, null, 2))

// Try moveWindow for comparison
useWindowStore.getState().moveWindow(windowId, 100, 100)

console.log('After moveWindow:', JSON.stringify(useWindowStore.getState().windows, null, 2))