import React, { useState, useEffect } from "react";
import { ApiServiceProvider } from "../api/ApiServiceProvider";
import { useApiService } from "../hooks/useApiService";

// @ts-ignore
import apiConfigYaml from "../api/api-endpoints.yml?raw";

const ApiConsumerExample: React.FC = () => {
  const [token, setToken] = useState<string>("your-auth-token-here");
  const [userId, setUserId] = useState<number>(1);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // This component must be rendered inside ApiServiceProvider
  const { get, put, setToken: setApiToken } = useApiService();

  // Set token in context (if changed)
  useEffect(() => {
    setApiToken(token);
  }, [token, setApiToken]);

  const handleGetUser = async () => {
    setLoading(true);
    await get(
      "getUser",
      { id: userId },
      {
        onComplete: (res: any) => {
          setLoading(false);
          setResult(res);
        },
      },
    );
  };

  const handleUpdateUser = async () => {
    setLoading(true);
    await put(
      "updateUser",
      {
        id: userId,
        name: "John Doe",
        email: "john.doe@example.com",
      },
      {
        onComplete: (res: any) => {
          setLoading(false);
          setResult(res);
        },
      },
    );
  };

  return (
    <div style={{ padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>API Consumer Example</h2>
      <div>
        <label>
          Auth Token:
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: 300, marginLeft: 8 }}
          />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>
          User ID:
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
            style={{ width: 80, marginLeft: 8 }}
          />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={handleGetUser} disabled={loading}>
          {loading ? "Loading..." : "Get User"}
        </button>
        <button
          onClick={handleUpdateUser}
          disabled={loading}
          style={{ marginLeft: 8 }}
        >
          {loading ? "Loading..." : "Update User"}
        </button>
      </div>
      <div style={{ marginTop: 24 }}>
        <strong>Result:</strong>
        <pre style={{ background: "#f8f8f8", padding: 12, borderRadius: 4 }}>
          {result ? JSON.stringify(result, null, 2) : "No result yet."}
        </pre>
      </div>
    </div>
  );
};

// Wrap the consumer in the provider for demonstration
export const ApiConsumerExampleWrapper: React.FC = () => (
  <ApiServiceProvider yamlConfig={apiConfigYaml} token="your-auth-token-here">
    <ApiConsumerExample />
  </ApiServiceProvider>
);

export default ApiConsumerExampleWrapper;
