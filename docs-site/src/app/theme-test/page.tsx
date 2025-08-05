import ThemeDemo from '@/components/ui/ThemeDemo';

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Theme System Test</h1>
      <p>This page demonstrates the dark/light theme switching functionality.</p>
      
      <ThemeDemo />
      
      <div className="mt-8">
        <h2>Instructions</h2>
        <ol>
          <li>Use the theme toggle button in the header to switch between light, dark, and system themes</li>
          <li>Observe how the colors change throughout the interface</li>
          <li>Check that the theme preference is persisted when you reload the page</li>
          <li>Test system theme by changing your OS theme preference</li>
        </ol>
      </div>
    </div>
  );
}