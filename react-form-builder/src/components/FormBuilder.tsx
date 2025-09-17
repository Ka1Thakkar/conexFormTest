import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import yaml from "js-yaml";

type SelectOptions = Record<string, string>;

/**
 * Represents a single form control (field or button) in the form.
 * @property {string} name - Unique name/key for the control.
 * @property {string} label - User-friendly label for the control.
 * @property {string} htmlControl - Type of HTML control ('input', 'textarea', 'select', etc.).
 * @property {string} [inputType] - Input type for 'input' controls (e.g., 'text', 'email', 'password').
 * @property {boolean} [disabled] - Whether the control is disabled.
 * @property {boolean} [required] - Whether the control is required.
 * @property {string} [placeholder] - Placeholder text for the control.
 * @property {SelectOptions} [selectOptions] - Options for select, radio, or checkbox controls.
 * @property {boolean} [selectMultiple] - Whether multiple options can be selected.
 * @property {string} [buttonClickAction] - Action for button controls ('complete' to submit).
 * @property {any} [initialValue] - Initial value for the control.
 * @property {any} [validations] - Validation rules for the control.
 * @property {boolean} [multiple] - For file controls, whether multiple files can be uploaded.
 */
type Control = {
  name: string;
  label: string;
  htmlControl: string;
  inputType?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  selectOptions?: SelectOptions;
  selectMultiple?: boolean;
  buttonClickAction?: string;
  initialValue?: any;
  validations?: any;
  multiple?: boolean;
};

/**
 * Represents a group of form controls and optional group-level validators.
 * @property {Control[]} formControls - Array of controls in the group.
 * @property {any[]} [formGroupValidators] - Optional array of group-level validators.
 */
type FormGroup = {
  formControls: Control[];
  formGroupValidators?: any[];
};

/**
 * Represents the overall form configuration loaded from YAML.
 * @property {string} [formTitle] - Title of the form.
 * @property {string} [formDescription] - Description of the form.
 * @property {FormGroup|FormGroup[]} formGroup - Form group(s) containing controls.
 */
type FormConfig = {
  formTitle?: string;
  formDescription?: string;
  formGroup: FormGroup | FormGroup[];
};

/**
 * Props for the FormBuilder component.
 * @property {string} yamlConfig - Raw YAML string for form configuration.
 * @property {string} [htmlSnippet] - Optional HTML snippet to display above the form.
 * @property {(data: Record<string, any>) => void} [onFormComplete] - Callback when form is successfully submitted.
 * @property {number|string} [formMaxWidth] - Max width of the form.
 * @property {string} [formMargin] - Margin for the form container.
 */
type FormBuilderProps = {
  yamlConfig: string;
  htmlSnippet?: string;
  onFormComplete?: (data: Record<string, any>) => void;
  formMaxWidth?: number | string;
  formMargin?: string;
};

/**
 * Represents a preview of an uploaded file.
 * @property {string} url - Preview URL (for images).
 * @property {string} name - File name.
 * @property {string} type - MIME type of the file.
 * @property {number} size - File size in bytes.
 */
type FilePreview = {
  url: string;
  name: string;
  type: string;
  size: number;
};

/**
 * Main React component for rendering a dynamic form based on YAML configuration.
 * @param {FormBuilderProps} props - Props for the FormBuilder component.
 * @returns {JSX.Element} The rendered form.
 */
export default function FormBuilder({
  yamlConfig,
  htmlSnippet,
  onFormComplete,
  formMaxWidth,
  formMargin,
}: FormBuilderProps) {
  let config: FormConfig;
  try {
    config = yaml.load(yamlConfig) as FormConfig;
  } catch (e: any) {
    return <div>Error parsing YAML: {e.message}</div>;
  }

  const formTitle = config.formTitle || "";
  const formDescription = config.formDescription || "";
  const formGroup: FormGroup = Array.isArray(config.formGroup)
    ? config.formGroup[0]
    : config.formGroup;
  const controls: Control[] = formGroup?.formControls || [];

  // Build defaultValues for react-hook-form
  const defaultValues: Record<string, any> = {};
  controls.forEach((control) => {
    if (control.htmlControl === "checkbox") {
      defaultValues[control.name] = Array.isArray(control.initialValue)
        ? control.initialValue
        : [];
    } else {
      defaultValues[control.name] = control.initialValue || "";
    }
  });

  // Build validation rules for react-hook-form
  /**
   * Generates validation rules for react-hook-form based on control configuration.
   * @param {Control} control - The form control configuration object.
   * @returns {Record<string, any>} Validation rules for the control.
   */
  function getValidationRules(control: Control) {
    const rules: Record<string, any> = {};
    const v = control.validations || {};
    const msgs = v.errorMessages || {};

    if (v.required) {
      rules.required = msgs.required || "This field is required.";
    }
    if (v.email) {
      rules.pattern = {
        value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
        message: msgs.email || "Invalid email address.",
      };
    }
    if (typeof v.minLength === "number" && v.minLength > 0) {
      rules.minLength = {
        value: v.minLength,
        message: msgs.minLength || `Minimum length is ${v.minLength}`,
      };
    }
    if (typeof v.maxLength === "number" && v.maxLength > 0) {
      rules.maxLength = {
        value: v.maxLength,
        message: msgs.maxLength || `Maximum length is ${v.maxLength}`,
      };
    }
    if (v.pattern) {
      try {
        rules.pattern = {
          value: new RegExp(v.pattern),
          message: msgs.pattern || "Invalid format.",
        };
      } catch {}
    }
    if (v.numericality) {
      if (v.numericality.onlyInteger) {
        rules.validate = {
          ...rules.validate,
          onlyInteger: (value: any) =>
            Number.isInteger(Number(value)) ||
            msgs.onlyInteger ||
            "Must be an integer.",
        };
      }
      if (
        typeof v.numericality.greaterThanOrEqualTo === "number" &&
        v.numericality.greaterThanOrEqualTo !== 0
      ) {
        rules.validate = {
          ...rules.validate,
          greaterThanOrEqualTo: (value: any) =>
            Number(value) >= v.numericality.greaterThanOrEqualTo ||
            msgs.greaterThanOrEqualTo ||
            `Must be >= ${v.numericality.greaterThanOrEqualTo}`,
        };
      }
      if (
        typeof v.numericality.lessThanOrEqualTo === "number" &&
        v.numericality.lessThanOrEqualTo !== 0
      ) {
        rules.validate = {
          ...rules.validate,
          lessThanOrEqualTo: (value: any) =>
            Number(value) <= v.numericality.lessThanOrEqualTo ||
            msgs.lessThanOrEqualTo ||
            `Must be <= ${v.numericality.lessThanOrEqualTo}`,
        };
      }
    }
    return rules;
  }

  // Dynamically build Zod schema from YAML config
  /**
   * Dynamically builds a Zod schema for the form based on the controls array.
   * @param {Control[]} controls - Array of form control configurations.
   * @returns {z.ZodObject<any>} Zod schema object for form validation.
   */
  function buildZodSchema(controls: Control[]) {
    const shape: Record<string, any> = {};

    controls.forEach((control) => {
      // Only validate input fields (not buttons)
      if (control.htmlControl === "button") return;

      const v = control.validations || {};
      const msgs = v.errorMessages || {};

      // Checkbox fields: expect array of strings
      if (control.htmlControl === "checkbox") {
        let arrField = z.array(z.string());
        if (v.required) {
          arrField = arrField.min(
            1,
            msgs.required || "At least one option must be selected",
          );
        }
        shape[control.name] = arrField;
        return;
      }

      // File upload fields
      if (control.htmlControl === "file") {
        if (control.multiple) {
          // Multiple files
          let arrField = z.array(z.any()).refine(
            (files) => {
              if (v.required && (!files || files.length === 0)) return false;
              if (!files || files.length === 0) return true;
              if (v.allowedFormats && Array.isArray(v.allowedFormats)) {
                return files.every((file: File) =>
                  v.allowedFormats.includes(file.type),
                );
              }
              return true;
            },
            {
              message:
                (v.errorMessages?.allowedFormats as string) ||
                "Invalid file format",
            },
          );
          if (v.required) {
            arrField = arrField.refine(
              (files) => files && files.length > 0,
              msgs.required || "At least one file is required",
            );
          }
          shape[control.name] = arrField;
        } else {
          // Single file
          let fileField = z.any().refine(
            (file) => {
              if (v.required && !file) return false;
              if (!file) return true;
              if (v.allowedFormats && Array.isArray(v.allowedFormats)) {
                return v.allowedFormats.includes(file.type);
              }
              return true;
            },
            {
              message:
                (v.errorMessages?.allowedFormats as string) ||
                "Invalid file format",
            },
          );
          if (v.required) {
            fileField = fileField.refine(
              (file) => !!file,
              msgs.required || "File is required",
            );
          }
          shape[control.name] = fileField;
        }
        return;
      }

      let field = z.string();

      // Required
      if (v.required) {
        field = field.min(1, msgs.required || "This field is required");
      }

      // Min Length
      if (typeof v.minLength === "number" && v.minLength > 0) {
        field = field.min(
          v.minLength,
          msgs.minLength || `Minimum length is ${v.minLength}`,
        );
      }

      // Max Length
      if (typeof v.maxLength === "number" && v.maxLength > 0) {
        field = field.max(
          v.maxLength,
          msgs.maxLength || `Maximum length is ${v.maxLength}`,
        );
      }

      // Email (apply after min/max)
      if (v.email) {
        field = field.email(msgs.email || "Invalid email address");
      }

      // Pattern
      if (v.pattern) {
        try {
          field = field.regex(
            new RegExp(v.pattern),
            msgs.pattern || "Invalid format",
          );
        } catch {}
      }

      // Date validation
      if (control.inputType === "date" || control.htmlControl === "dateRange") {
        // For date fields, use Zod's date parsing and validation
        // Accepts string, but validates as date
        let dateField = z
          .string()
          .refine(
            (val) => !v.required || !!val,
            msgs.required || "This field is required",
          );
        if (v.minDate) {
          dateField = dateField.refine(
            (val) => !val || val >= v.minDate,
            msgs.minDate || `Date must be after ${v.minDate}`,
          );
        }
        if (v.maxDate) {
          dateField = dateField.refine(
            (val) => !val || val <= v.maxDate,
            msgs.maxDate || `Date must be before ${v.maxDate}`,
          );
        }
        field = dateField;
      }

      // Numericality (onlyInteger)
      if (v.numericality && v.numericality.onlyInteger) {
        field = field.refine(
          (val) => Number.isInteger(Number(val)),
          msgs.onlyInteger || "Must be an integer",
        );
      }

      // Numericality (greaterThanOrEqualTo)
      if (
        v.numericality &&
        typeof v.numericality.greaterThanOrEqualTo === "number" &&
        v.numericality.greaterThanOrEqualTo !== 0
      ) {
        field = field.refine(
          (val) => Number(val) >= v.numericality.greaterThanOrEqualTo,
          msgs.greaterThanOrEqualTo ||
            `Must be >= ${v.numericality.greaterThanOrEqualTo}`,
        );
      }

      // Numericality (lessThanOrEqualTo)
      if (
        v.numericality &&
        typeof v.numericality.lessThanOrEqualTo === "number" &&
        v.numericality.lessThanOrEqualTo !== 0
      ) {
        field = field.refine(
          (val) => Number(val) <= v.numericality.lessThanOrEqualTo,
          msgs.lessThanOrEqualTo ||
            `Must be <= ${v.numericality.lessThanOrEqualTo}`,
        );
      }

      // Date range validation
      if (control.htmlControl === "dateRange") {
        // Expect an object with from/to
        shape[control.name] = z
          .object({
            from: z
              .string()
              .refine(
                (val) => !!val,
                v.errorMessages?.required || "Start date is required",
              ),
            to: z
              .string()
              .refine(
                (val) => !!val,
                v.errorMessages?.required || "End date is required",
              ),
          })
          .refine(
            (obj) => {
              // Only validate if both dates are present
              if (!obj.from || !obj.to) return true;
              return obj.from <= obj.to;
            },
            {
              message:
                v.errorMessages?.range || "End date must be after start date",
              path: ["to"],
            },
          );
      } else {
        shape[control.name] = field;
      }
    });

    return z.object(shape);
  }

  const dynamicSchema = buildZodSchema(controls);

  // File upload state for previews
  const [filePreviews, setFilePreviews] = React.useState<
    Record<string, FilePreview[] | FilePreview | null>
  >({});

  // Helper for file change and remove
  const handleFileChange = (
    fieldName: string,
    multiple: boolean,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (multiple) {
      const files = Array.from(e.target.files ?? []);
      setValue(fieldName, files);
      if (files.length > 0) {
        const previews: FilePreview[] = files.map((file) => ({
          url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
          name: file.name,
          type: file.type,
          size: file.size,
        }));
        setFilePreviews((prev) => ({
          ...prev,
          [fieldName]: previews,
        }));
      } else {
        setFilePreviews((prev) => ({
          ...prev,
          [fieldName]: [],
        }));
      }
    } else {
      const file = e.target.files?.[0] || null;
      setValue(fieldName, file);
      if (file) {
        const preview: FilePreview = {
          url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
          name: file.name,
          type: file.type,
          size: file.size,
        };
        setFilePreviews((prev) => ({
          ...prev,
          [fieldName]: preview,
        }));
      } else {
        setFilePreviews((prev) => ({
          ...prev,
          [fieldName]: null,
        }));
      }
    }
  };

  const handleRemoveFile = (fieldName: string, index?: number) => {
    if (typeof index === "number") {
      setValue(fieldName, (prev: File[]) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        arr.splice(index, 1);
        return arr;
      });
      setFilePreviews((prev) => {
        const arr = Array.isArray(prev[fieldName])
          ? [...(prev[fieldName] as FilePreview[])]
          : [];
        arr.splice(index, 1);
        return {
          ...prev,
          [fieldName]: arr,
        };
      });
    } else {
      setValue(fieldName, null);
      setFilePreviews((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(dynamicSchema),
  });

  // Render form controls
  const renderedControls = controls.map((control) => {
    const error = errors[control.name]?.message as string | undefined;
    const inputClass = "form-control";
    const disabled = control.disabled === true;
    const required = control.required === true;
    const placeholder = control.placeholder || "";
    const validationRules = getValidationRules(control);

    switch (control.htmlControl) {
      case "textarea":
        return (
          <div key={control.name} className="mb-3">
            <label htmlFor={control.name} className="form-label">
              {control.label}
            </label>
            <textarea
              {...register(control.name, validationRules)}
              className={inputClass}
              disabled={disabled}
              placeholder={placeholder}
            />
            {errors[control.name] && (
              <div className="text-danger small mt-1">
                {errors[control.name]?.message}
              </div>
            )}
          </div>
        );
      case "select":
        return (
          <div key={control.name} className="mb-3">
            <label htmlFor={control.name} className="form-label">
              {control.label}
            </label>
            <select
              {...register(control.name, validationRules)}
              className={inputClass}
              disabled={disabled}
              multiple={control.selectMultiple}
            >
              <option value="">Select...</option>
              {control.selectOptions &&
                Object.entries(control.selectOptions).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
            </select>
            {errors[control.name] && (
              <div className="text-danger small mt-1">
                {errors[control.name]?.message}
              </div>
            )}
          </div>
        );
      case "radio":
        return (
          <div key={control.name} className="mb-3">
            <label className="form-label">{control.label}</label>
            <div>
              {control.selectOptions &&
                Object.entries(control.selectOptions).map(([val, label]) => (
                  <div className="form-check form-check-inline" key={val}>
                    <input
                      {...register(control.name, validationRules)}
                      className="form-check-input"
                      type="radio"
                      value={val}
                      disabled={disabled}
                      id={`${control.name}_${val}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`${control.name}_${val}`}
                    >
                      {label}
                    </label>
                  </div>
                ))}
            </div>
            {errors[control.name] && (
              <div className="text-danger small mt-1">
                {errors[control.name]?.message}
              </div>
            )}
          </div>
        );
      case "checkbox":
        return (
          <div key={control.name} className="mb-3">
            <label className="form-label">{control.label}</label>
            <div>
              {control.selectOptions &&
                Object.entries(control.selectOptions).map(([val, label]) => (
                  <div className="form-check form-check-inline" key={val}>
                    <input
                      {...register(control.name, validationRules)}
                      className="form-check-input"
                      type="checkbox"
                      value={val}
                      disabled={disabled}
                      id={`${control.name}_${val}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`${control.name}_${val}`}
                    >
                      {label}
                    </label>
                  </div>
                ))}
            </div>
            {errors[control.name] && (
              <div className="text-danger small mt-1">
                {errors[control.name]?.message}
              </div>
            )}
          </div>
        );
      case "dateRange":
        // Render two date pickers for from/to
        return (
          <div key={control.name} className="mb-3">
            <label className="form-label">{control.label}</label>
            <div className="d-flex gap-2 align-items-center">
              <input
                {...register(`${control.name}.from`)}
                className={inputClass}
                type="date"
                placeholder="From"
              />
              <span>to</span>
              <input
                {...register(`${control.name}.to`)}
                className={inputClass}
                type="date"
                placeholder="To"
              />
            </div>
            {((errors[control.name] as any)?.from ||
              (errors[control.name] as any)?.to ||
              (errors[control.name] as any)?.range) && (
              <div className="text-danger small mt-1">
                {(errors[control.name] as any)?.from?.message ||
                  (errors[control.name] as any)?.to?.message ||
                  (errors[control.name] as any)?.range?.message}
              </div>
            )}
          </div>
        );
      case "file":
        // File upload field with improved preview and remove button, supports multiple files
        return (
          <div key={control.name} className="mb-3">
            <label htmlFor={control.name} className="form-label">
              {control.label}
            </label>
            <div className="input-group">
              <input
                className="form-control"
                type="file"
                id={control.name}
                accept={
                  control.validations?.allowedFormats
                    ? control.validations.allowedFormats.join(",")
                    : undefined
                }
                multiple={!!control.multiple}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (control.multiple) {
                    setValue(control.name, files);
                    if (files.length > 0) {
                      const previews: FilePreview[] = files.map((file) => ({
                        url: file.type.startsWith("image/")
                          ? URL.createObjectURL(file)
                          : "",
                        name: file.name,
                        type: file.type,
                        size: file.size,
                      }));
                      setFilePreviews((prev) => ({
                        ...prev,
                        [control.name]: previews,
                      }));
                    } else {
                      setFilePreviews((prev) => ({
                        ...prev,
                        [control.name]: [],
                      }));
                    }
                  } else {
                    const file = files[0] || null;
                    setValue(control.name, file);
                    if (file) {
                      const preview: FilePreview = {
                        url: file.type.startsWith("image/")
                          ? URL.createObjectURL(file)
                          : "",
                        name: file.name,
                        type: file.type,
                        size: file.size,
                      };
                      setFilePreviews((prev) => ({
                        ...prev,
                        [control.name]: preview,
                      }));
                    } else {
                      setFilePreviews((prev) => ({
                        ...prev,
                        [control.name]: null,
                      }));
                    }
                  }
                }}
              />
            </div>
            {/* Preview for multiple files */}
            {Array.isArray(filePreviews[control.name]) &&
              (filePreviews[control.name] as FilePreview[]).length > 0 && (
                <div className="mt-3">
                  {(filePreviews[control.name] as FilePreview[]).map(
                    (preview, idx) => (
                      <div
                        key={idx}
                        className="d-flex align-items-center gap-3 mb-2"
                      >
                        {preview.url ? (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="border rounded"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <i
                            className="bi bi-file-earmark"
                            style={{ fontSize: "2rem" }}
                          ></i>
                        )}
                        <div>
                          <div
                            className="fw-bold text-truncate"
                            style={{ maxWidth: "180px" }}
                          >
                            {preview.name}
                          </div>
                          <div className="text-muted small">{preview.type}</div>
                          <div className="text-muted small">
                            {(preview.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveFile(control.name, idx)}
                          title="Remove file"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            {/* Preview for single file */}
            {!Array.isArray(filePreviews[control.name]) &&
              filePreviews[control.name] && (
                <div className="mt-3 d-flex align-items-center gap-3">
                  {(filePreviews[control.name] as FilePreview).url ? (
                    <img
                      src={(filePreviews[control.name] as FilePreview).url}
                      alt={(filePreviews[control.name] as FilePreview).name}
                      className="border rounded"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <i
                      className="bi bi-file-earmark"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  )}
                  <div>
                    <div
                      className="fw-bold text-truncate"
                      style={{ maxWidth: "180px" }}
                    >
                      {(filePreviews[control.name] as FilePreview).name}
                    </div>
                    <div className="text-muted small">
                      {(filePreviews[control.name] as FilePreview).type}
                    </div>
                    <div className="text-muted small">
                      {(
                        (filePreviews[control.name] as FilePreview).size / 1024
                      ).toFixed(1)}{" "}
                      KB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleRemoveFile(control.name)}
                    title="Remove file"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              )}
            {errors[control.name] && (
              <div className="text-danger small mt-1">
                {errors[control.name]?.message}
              </div>
            )}
          </div>
        );
      case "button":
        return (
          <div key={control.name} className="mb-3">
            <button
              className="btn btn-primary"
              type={
                control.buttonClickAction === "complete" ? "submit" : "button"
              }
              disabled={disabled}
            >
              {control.label}
            </button>
          </div>
        );
      case "input":
        if (control.inputType === "date") {
          return (
            <div key={control.name} className="mb-3">
              <label htmlFor={control.name} className="form-label">
                {control.label}
              </label>
              <input
                {...register(control.name, validationRules)}
                className={inputClass}
                type="date"
                disabled={disabled}
                placeholder={placeholder}
              />
              {errors[control.name] && (
                <div className="text-danger small mt-1">
                  {errors[control.name]?.message}
                </div>
              )}
            </div>
          );
        } else if (control.inputType === "password") {
          return (
            <div key={control.name} className="mb-3">
              <label htmlFor={control.name} className="form-label">
                {control.label}
              </label>
              <div className="input-group">
                <input
                  {...register(control.name, validationRules)}
                  className={inputClass}
                  type={showPassword ? "text" : "password"}
                  disabled={disabled}
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  style={{ minWidth: "40px" }}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
              {errors[control.name] && (
                <div className="text-danger small mt-1">
                  {errors[control.name]?.message}
                </div>
              )}
            </div>
          );
        } else {
          // Render other input types (text, email, etc.)
          return (
            <div key={control.name} className="mb-3">
              <label htmlFor={control.name} className="form-label">
                {control.label}
              </label>
              <input
                {...register(control.name, validationRules)}
                className={inputClass}
                type={control.inputType || "text"}
                disabled={disabled}
                placeholder={placeholder}
              />
              {errors[control.name] && (
                <div className="text-danger small mt-1">
                  {errors[control.name]?.message}
                </div>
              )}
            </div>
          );
        }
      default:
        return null;
    }
  });

  const formMeta = (
    <>
      {formTitle && <h2>{formTitle}</h2>}
      {formDescription && <p>{formDescription}</p>}
    </>
  );

  const onSubmit = (data: Record<string, any>) => {
    if (typeof onFormComplete === "function") {
      onFormComplete(data);
    }
  };

  // If htmlSnippet is provided, inject controls into a placeholder div
  if (htmlSnippet) {
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        {formMeta}
        <div dangerouslySetInnerHTML={{ __html: htmlSnippet }} />
        <div>{renderedControls}</div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 border rounded shadow-sm bg-light"
      style={{
        maxWidth: formMaxWidth ?? "",
        margin: formMargin ?? "auto auto",
      }}
    >
      {formMeta}
      {renderedControls}
    </form>
  );
}
