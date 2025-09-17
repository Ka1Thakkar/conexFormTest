# React Form Builder

A dynamic, schema-driven form builder for React, powered by YAML configuration. Supports a wide range of input types, validation, file uploads, and custom error messages.

## Features

- **YAML-based configuration:** Define forms and validation rules in simple YAML files.
- **Rich input support:** Input, textarea, select, radio, checkbox, date, date range, file upload, and buttons.
- **Validation:** Uses [Zod](https://github.com/colinhacks/zod) and [react-hook-form](https://react-hook-form.com/) for robust validation.
- **Custom error messages:** Specify user-friendly error messages in your YAML.
- **File previews:** Preview uploaded images and files before submitting.
- **Bootstrap styling:** Out-of-the-box support for Bootstrap 5 and Bootstrap Icons.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Define your form in YAML

See [`src/forms/login-form.yml`](src/forms/login-form.yml) or [`src/forms/test-form/test-form.yml`](src/forms/test-form/test-form.yml) for examples.

### 3. Import and use the FormBuilder component

```tsx
import FormBuilder from "./components/FormBuilder";
import loginFormYml from "./forms/login-form.yml?raw";

const yamlConfig: string = loginFormYml;

<FormBuilder
  yamlConfig={yamlConfig}
  htmlSnippet="<h2>Login</h2><p>Please fill out the form below:</p>"
  onFormComplete={data => console.log(data)}
/>
```

### 4. Handle form completion

Provide an `onFormComplete` callback to receive the validated form data.

```tsx
function handleFormComplete(data: Record<string, any>) {
  alert("Form submitted! Data: " + JSON.stringify(data, null, 2));
}
```

## YAML Configuration Format

A form YAML file should define:

- `formTitle`: Title displayed at the top of the form.
- `formDescription`: Description for the form.
- `formGroup`: Array of form groups, each with controls and optional validators.
- `formControls`: Array of controls (fields/buttons) with type, label, validation, etc.

Example snippet:

```yaml
formTitle: "Login"
formDescription: "Form for user login"
formGroup:
  - formControls:
      - name: "email"
        label: "Email Address"
        htmlControl: "input"
        inputType: "email"
        required: true
        validations:
          required: true
          email: true
          errorMessages:
            required: "Email address is required"
            email: "Email address is not valid"
      - name: "password"
        label: "Password"
        htmlControl: "input"
        inputType: "password"
        required: true
        validations:
          required: true
          minLength: 8
          errorMessages:
            required: "Password is required"
            minLength: "Password must be at least 8 characters"
      - name: "login"
        label: "Login"
        htmlControl: "button"
        buttonClickAction: "complete"
```

## Supported Field Types

- **input**: text, email, password, date, number, etc.
- **textarea**
- **select**
- **radio**
- **checkbox**
- **dateRange**
- **file**: single or multiple file uploads
- **button**

## Development

- **Start dev server:**  
  ```bash
  npm run dev
  ```
- **Build for production:**  
  ```bash
  npm run build
  ```

## File Structure

- `src/components/FormBuilder.tsx` — Main form builder component
- `src/forms/` — Example YAML form definitions
- `src/App.tsx` — Example usage with login form
- `src/AppTest.tsx` — Example usage with test form

## License

ISC

---

For advanced usage, custom validators, or extending field types, see the source code and comments in `FormBuilder.tsx`.