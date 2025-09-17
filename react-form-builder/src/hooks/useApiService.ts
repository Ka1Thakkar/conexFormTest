import { useContext } from "react";
import {
  ApiServiceContext,
  ApiServiceContextType,
} from "../api/ApiServiceProvider";

/**
 * Custom hook to access the API service context.
 * Throws an error if used outside of ApiServiceProvider.
 */

export function useApiService(): ApiServiceContextType {
  const ctx = useContext(ApiServiceContext);
  if (!ctx) {
    throw new Error("useApiService must be used within an ApiServiceProvider");
  }
  return ctx;
}
