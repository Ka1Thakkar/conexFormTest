import React, { createContext, useContext, useRef, useState } from "react";
import { parseYaml } from "../utils/yamlParser";

// Types for API endpoint config
export type ApiEndpointConfig = {
  endpointName: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  requiresAuth?: boolean;
  retry?: number;
  mock?: boolean;
  cache?: boolean;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
};

export type ApiServiceConfig = {
  conexResourceId: string;
  serviceName: string;
  serviceTitle: string;
  serviceDescription: string;
  endpoints: ApiEndpointConfig[];
};

export type ApiServiceProviderProps = {
  yamlConfig: string; // YAML string for API config
  token?: string; // Auth token (optional, can be set later)
  children: React.ReactNode;
};

export type ApiRequestOptions = {
  onComplete?: (result: ApiResult) => void;
  useMock?: boolean;
  useCache?: boolean;
};

export type ApiResult = {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
};

export type ApiServiceContextType = {
  get: (
    endpointName: string,
    params?: any,
    options?: ApiRequestOptions,
  ) => Promise<ApiResult>;
  post: (
    endpointName: string,
    data?: any,
    options?: ApiRequestOptions,
  ) => Promise<ApiResult>;
  put: (
    endpointName: string,
    data?: any,
    options?: ApiRequestOptions,
  ) => Promise<ApiResult>;
  delete: (
    endpointName: string,
    params?: any,
    options?: ApiRequestOptions,
  ) => Promise<ApiResult>;
  setToken: (token: string) => void;
  config: ApiServiceConfig | null;
};

export const ApiServiceContext = createContext<
  ApiServiceContextType | undefined
>(undefined);

// Simple in-memory cache
const apiCache: Record<string, any> = {};

// Helper: Validate data against schema
function validateData(
  data: any,
  schema: any,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!schema) return { valid: true, errors };
  Object.entries(schema).forEach(([key, rules]: [string, any]) => {
    const value = data[key];
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(
        rules.validations?.errorMessages?.required || `${key} is required`,
      );
    }
    if (
      rules.valueType === "integer" &&
      value !== undefined &&
      typeof value !== "number"
    ) {
      errors.push(`${key} must be an integer`);
    }
    if (
      rules.valueType === "string" &&
      value !== undefined &&
      typeof value !== "string"
    ) {
      errors.push(`${key} must be a string`);
    }
    if (rules.validations) {
      if (
        rules.validations.minLength &&
        typeof value === "string" &&
        value.length < rules.validations.minLength
      ) {
        errors.push(
          rules.validations.errorMessages?.minLength ||
            `${key} must be at least ${rules.validations.minLength} characters`,
        );
      }
      if (
        rules.validations.maxLength &&
        typeof value === "string" &&
        value.length > rules.validations.maxLength
      ) {
        errors.push(
          rules.validations.errorMessages?.maxLength ||
            `${key} must be at most ${rules.validations.maxLength} characters`,
        );
      }
      if (rules.validations.email && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(
            rules.validations.errorMessages?.email ||
              `${key} is not a valid email`,
          );
        }
      }
      if (
        rules.validations.minValue !== undefined &&
        typeof value === "number" &&
        value < rules.validations.minValue
      ) {
        errors.push(
          rules.validations.errorMessages?.minValue ||
            `${key} must be at least ${rules.validations.minValue}`,
        );
      }
      // Add more validation rules as needed
    }
  });
  return { valid: errors.length === 0, errors };
}

// Helper: Find endpoint config by name
function findEndpoint(
  config: ApiServiceConfig | null,
  endpointName: string,
): ApiEndpointConfig | undefined {
  return config?.endpoints.find((ep) => ep.endpointName === endpointName);
}

// Helper: Build request URL with params for GET/DELETE
function buildUrl(url: string, params?: any): string {
  if (!params) return url;
  const query = Object.entries(params)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return query ? `${url}?${query}` : url;
}

// Helper: Retry logic
async function retryRequest(
  fn: () => Promise<ApiResult>,
  retries: number,
): Promise<ApiResult> {
  let lastError: ApiResult = { success: false, error: "Unknown error" };
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn();
      if (result.success) return result;
      lastError = result;
    } catch (err: any) {
      lastError = { success: false, error: err.message };
    }
  }
  return lastError;
}

// Main Provider
export const ApiServiceProvider: React.FC<ApiServiceProviderProps> = ({
  yamlConfig,
  token: initialToken,
  children,
}) => {
  const [config] = useState<ApiServiceConfig | null>(() => {
    try {
      return parseYaml(yamlConfig) as ApiServiceConfig;
    } catch (err) {
      console.error("Failed to parse API config YAML:", err);
      return null;
    }
  });
  const tokenRef = useRef<string | undefined>(initialToken);

  // Allow token to be set after initialization
  const setToken = (token: string) => {
    tokenRef.current = token;
  };

  // Core API request handler
  const request = async (
    endpointName: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    payload?: any,
    options?: ApiRequestOptions,
  ): Promise<ApiResult> => {
    const endpoint = findEndpoint(config, endpointName);
    if (!endpoint) {
      const error = `Endpoint "${endpointName}" not found in configuration`;
      options?.onComplete?.({ success: false, error });
      return { success: false, error };
    }

    // Validate request data
    const validation = validateData(payload || {}, endpoint.requestSchema);
    if (!validation.valid) {
      const error = `Validation failed: ${validation.errors.join(", ")}`;
      options?.onComplete?.({ success: false, error });
      return { success: false, error };
    }

    // Handle mock response
    if (options?.useMock || endpoint.mock) {
      // Simulate mock response
      const mockData = { mock: true, endpoint: endpointName, payload };
      options?.onComplete?.({ success: true, data: mockData });
      return { success: true, data: mockData };
    }

    // Handle cache
    if ((options?.useCache || endpoint.cache) && method === "GET") {
      const cacheKey = `${endpointName}:${JSON.stringify(payload)}`;
      if (apiCache[cacheKey]) {
        options?.onComplete?.({ success: true, data: apiCache[cacheKey] });
        return { success: true, data: apiCache[cacheKey] };
      }
    }

    // Prepare request
    const url =
      method === "GET" || method === "DELETE"
        ? buildUrl(endpoint.url, payload)
        : endpoint.url;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(endpoint.requiresAuth && tokenRef.current
          ? { Authorization: `Bearer ${tokenRef.current}` }
          : {}),
      },
      ...(method === "POST" || method === "PUT"
        ? { body: JSON.stringify(payload) }
        : {}),
    };

    // Retry logic
    const doFetch = async (): Promise<ApiResult> => {
      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMsg = data?.message || `API error: ${response.status}`;
          options?.onComplete?.({
            success: false,
            error: errorMsg,
            status: response.status,
          });
          return { success: false, error: errorMsg, status: response.status };
        }
        // Optionally validate response schema here
        // Cache result if needed
        if ((options?.useCache || endpoint.cache) && method === "GET") {
          const cacheKey = `${endpointName}:${JSON.stringify(payload)}`;
          apiCache[cacheKey] = data;
        }
        options?.onComplete?.({ success: true, data, status: response.status });
        return { success: true, data, status: response.status };
      } catch (err: any) {
        options?.onComplete?.({ success: false, error: err.message });
        return { success: false, error: err.message };
      }
    };

    const result = endpoint.retry
      ? await retryRequest(doFetch, endpoint.retry)
      : await doFetch();

    return result;
  };

  // API methods
  const get = (
    endpointName: string,
    params?: any,
    options?: ApiRequestOptions,
  ) => request(endpointName, "GET", params, options);

  const post = (
    endpointName: string,
    data?: any,
    options?: ApiRequestOptions,
  ) => request(endpointName, "POST", data, options);

  const put = (endpointName: string, data?: any, options?: ApiRequestOptions) =>
    request(endpointName, "PUT", data, options);

  const del = (
    endpointName: string,
    params?: any,
    options?: ApiRequestOptions,
  ) => request(endpointName, "DELETE", params, options);

  const contextValue: ApiServiceContextType = {
    get,
    post,
    put,
    delete: del,
    setToken,
    config,
  };

  return (
    <ApiServiceContext.Provider value={contextValue}>
      {children}
    </ApiServiceContext.Provider>
  );
};

// Hook for consuming the API service
export function useApiService(): ApiServiceContextType {
  const ctx = useContext(ApiServiceContext);
  if (!ctx)
    throw new Error("useApiService must be used within an ApiServiceProvider");
  return ctx;
}
