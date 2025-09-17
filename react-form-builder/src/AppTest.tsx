import React from "react";
import { createRoot } from "react-dom/client";
import FormBuilder from "./components/FormBuilder";
import testFormYml from "./forms/test-form/test-form.yml?raw";
import ApiConsumerExampleWrapper from "./components/ApiConsumerExample";

const yamlConfig: string = testFormYml;

/**
 * Callback function to handle form completion.
 * @param {Record<string, any>} data - The validated form data.
 * @returns {void}
 */
const handleFormComplete = (data: Record<string, any>) => {
  alert("Form submitted! Data:\n" + JSON.stringify(data, null, 2));
  console.log("Form Data:", data);
};

/**
 * Main entry point: renders the FormBuilder component with the test form YAML.
 */
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <FormBuilder yamlConfig={yamlConfig} onFormComplete={handleFormComplete} />
    <ApiConsumerExampleWrapper />
  </React.StrictMode>,
);
