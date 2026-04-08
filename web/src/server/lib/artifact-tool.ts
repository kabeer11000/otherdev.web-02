export const CREATE_ARTIFACT_TOOL_NAME = 'create_artifact'

export const createArtifactTool = {
  type: 'function' as const,
  function: {
    name: CREATE_ARTIFACT_TOOL_NAME,
    description:
      'Create an interactive web artifact that will be displayed in a live preview panel. Supports vanilla HTML/CSS/JS or modern frameworks (React, Vue, Tailwind CSS) via CDN. Use this when the user asks to create, build, make, or generate interactive content like websites, apps, games, visualizations, calculators, forms, dashboards, or any web-based UI. The artifact should be complete, self-contained, and visually polished.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A short, descriptive title for the artifact (max 100 chars)',
        },
        code: {
          type: 'string',
          description:
            'Complete HTML code. Can use modern frameworks via CDN: React (unpkg.com/react, unpkg.com/react-dom, unpkg.com/@babel/standalone for JSX), Tailwind CSS (cdn.tailwindcss.com), Vue, etc. Include CSS in <style> tags and JavaScript in <script> tags. Must be self-contained and work in a sandboxed iframe (max 50KB)',
        },
        description: {
          type: 'string',
          description:
            'A brief explanation of what this artifact does and how to use it (max 500 chars)',
        },
      },
      required: ['title', 'code', 'description'],
    },
  },
}
