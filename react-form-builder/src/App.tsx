import React from "react";
import { createRoot } from "react-dom/client";
import FormBuilder from "./components/FormBuilder";
import yaml from "js-yaml";

// Import the demo login form YAML as a string
import loginFormYml from "./forms/login-form.yml?raw";

// Pass the raw YAML string to FormBuilder
const yamlConfig: string = loginFormYml;

// Example HTML snippet for demonstration (optional)
const htmlSnippet: string = `
  <h2>Login</h2>
  <p>Please fill out the form below:</p>
`;

function handleFormComplete(data: Record<string, any>) {
  alert("Form submitted! Data: " + JSON.stringify(data, null, 2));
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <FormBuilder
      yamlConfig={yamlConfig}
      htmlSnippet={htmlSnippet}
      onFormComplete={handleFormComplete}
    />
  </React.StrictMode>,
);
