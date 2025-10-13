import { createFileRoute } from '@tanstack/react-router';
import { DynamicInput } from '@/lib/components/DynamicInput/DynamicInput';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return (
    <div className="h-dvh w-dvw flex items-center justify-center">
      <DynamicInput
        value={{
          text: 'foo',

          attributes: {
            priority: {
              // example value: 'p1',
              regex: /p[1-3]/i,
            },
            currency: {
              // example value: 'USD',
              regex: /(USD|EUR|TRY)/i,
            },
          },
        }}
        onValueChange={(value) => {
          value.text;
          value.attributes.priority;
          value.attributes.currency;
        }}
      />
    </div>
  );
}
