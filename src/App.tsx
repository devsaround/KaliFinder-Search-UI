import WidgetEmbed from './components/WidgetEmbed';

export default function App() {
  // For dev/testing: show embedded widget pattern
  // First shows search icon, click to open full widget
  return (
    <div className="min-h-screen bg-gray-50">
      <WidgetEmbed storeUrl="https://localhost:8080" />
    </div>
  );
}
