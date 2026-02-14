Create a new React component following project conventions:

1. Create the component file in the appropriate `src/components/` subdirectory
2. Follow the 300-line maximum rule - plan extraction points if complex
3. Use TypeScript with explicit prop types (interface, not type alias)
4. Use functional component with hooks pattern
5. Support Hebrew RTL: use Tailwind logical properties (ps-4, pe-4, ms-auto, me-auto)
6. Add error boundary wrapper if the component handles async data
7. Add loading skeleton if the component fetches data
8. Create a unit test file (*.test.tsx) with 80%+ coverage target
9. Create a Storybook story (*.stories.tsx) with key variants
10. Use `@/components/ui/` primitives for base elements (Button, Card, Badge, etc.)

Component name: $ARGUMENTS
