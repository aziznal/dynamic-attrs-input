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
              regex: 'p[1-3]',
            },
            currency: {
              // example value: '123.21 USD',
              regex: /\d*\.?\d*\s?(USD|EUR|TRY)/,
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
