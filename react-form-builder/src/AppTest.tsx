import React from "react";
import { createRoot } from "react-dom/client";
import FormBuilder from "./components/FormBuilder";
import testFormYml from "./forms/test-form/test-form.yml?raw";

const yamlConfig: string = testFormYml;

const handleFormComplete = (data: Record<string, any>) => {
  alert("Form submitted! Data:\n" + JSON.stringify(data, null, 2));
  console.log("Form Data:", data);
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <FormBuilder
      yamlConfig={yamlConfig}
      onFormComplete={handleFormComplete}
    />
  </React.StrictMode>
);
