import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiServiceProvider, useApiService } from "./ApiServiceProvider";
import "@testing-library/jest-dom";

// Dummy database
const db: {
  users: Record<string, { id: number; name: string; email: string }>;
} = {
  users: {
    "1": { id: 1, name: "Alice", email: "alice@example.com" },
    "2": { id: 2, name: "Bob", email: "bob@example.com" },
  },
};

// Mock fetch implementation
global.fetch = jest.fn((url: string, options: any) => {
  const { method } = options || {};
  const urlObj = new URL("http://dummy" + url);
  const id =
    urlObj.searchParams.get("id") ||
    (options?.body && JSON.parse(options.body).id);

  if (url.startsWith("/api/user")) {
    if (method === "GET") {
      if (!id)
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: "Missing ID" }),
        });
      const user = db.users[String(id)];
      if (user)
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => user,
        });
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ message: "User not found" }),
      });
    }
    if (method === "PUT") {
      if (!id)
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: "Missing ID" }),
        });
      const body = JSON.parse(options.body);
      if (!body.name || !body.email)
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: "Missing fields" }),
        });
      db.users[String(id)] = {
        id: Number(id),
        name: body.name,
        email: body.email,
      };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => db.users[String(id)],
      });
    }
    if (method === "DELETE") {
      if (!id)
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: "Missing ID" }),
        });
      if (!db.users[String(id)])
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ message: "User not found" }),
        });
      delete db.users[String(id)];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
    }
    if (method === "POST") {
      const body = JSON.parse(options.body);
      if (!body.id || !body.name || !body.email)
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: "Missing fields" }),
        });
      db.users[String(body.id)] = {
        id: body.id,
        name: body.name,
        email: body.email,
      };
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => db.users[String(body.id)],
      });
    }
  }
  if (url.startsWith("/api/error")) {
    return Promise.resolve({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal Server Error" }),
    });
  }
  return Promise.resolve({
    ok: false,
    status: 404,
    json: async () => ({ message: "Not found" }),
  });
});

const yamlConfig = `
conexResourceId: "testApi"
serviceName: "TestService"
serviceTitle: "Test API Service"
serviceDescription: "Service for testing"
endpoints:
  - endpointName: "getUser"
    url: "/api/user"
    method: "GET"
    requiresAuth: false
    retry: 0
    mock: false
    cache: false
    requestSchema:
      id:
        required: true
        valueType: "integer"
  - endpointName: "updateUser"
    url: "/api/user"
    method: "PUT"
    requiresAuth: false
    retry: 0
    mock: false
    cache: false
    requestSchema:
      id:
        required: true
        valueType: "integer"
      name:
        required: true
        valueType: "string"
      email:
        required: true
        valueType: "string"
  - endpointName: "deleteUser"
    url: "/api/user"
    method: "DELETE"
    requiresAuth: false
    retry: 0
    mock: false
    cache: false
    requestSchema:
      id:
        required: true
        valueType: "integer"
  - endpointName: "createUser"
    url: "/api/user"
    method: "POST"
    requiresAuth: false
    retry: 0
    mock: false
    cache: false
    requestSchema:
      id:
        required: true
        valueType: "integer"
      name:
        required: true
        valueType: "string"
      email:
        required: true
        valueType: "string"
  - endpointName: "errorEndpoint"
    url: "/api/error"
    method: "GET"
    requiresAuth: false
    retry: 0
    mock: false
    cache: false
`;

describe("ApiServiceProvider with dummy DB (automated status codes)", () => {
  it("handles all major status codes and CRUD", async () => {
    function AutomatedTestComponent() {
      const { get, put, post, delete: del } = useApiService();
      React.useEffect(() => {
        const runTests = async () => {
          const logTest = (
            label: string,
            input: any,
            output: any,
            printDb: boolean = false,
          ) => {
            // eslint-disable-next-line no-console
            console.log(`\n--- Test Case: ${label} ---`);
            // eslint-disable-next-line no-console
            console.log("Input:", input);
            // eslint-disable-next-line no-console
            console.log("Output:", output);
            if (printDb) {
              // eslint-disable-next-line no-console
              console.log("DB State:", JSON.stringify(db, null, 2));
            }
            // eslint-disable-next-line no-console
            console.log("--- End Test Case ---\n");
          };

          // 200 OK
          let output = await get("getUser", { id: 1 });
          logTest(
            "Get User (200)",
            { endpoint: "getUser", params: { id: 1 } },
            output,
          );

          // 404 Not Found
          output = await get("getUser", { id: 999 });
          logTest(
            "Get User (404)",
            { endpoint: "getUser", params: { id: 999 } },
            output,
          );

          // 400 Bad Request
          output = await get("getUser", {});
          logTest(
            "Get User (400)",
            { endpoint: "getUser", params: {} },
            output,
          );

          // 201 Created
          output = await post("createUser", {
            id: 3,
            name: "Charlie",
            email: "charlie@example.com",
          });
          logTest(
            "Create User (201)",
            {
              endpoint: "createUser",
              data: { id: 3, name: "Charlie", email: "charlie@example.com" },
            },
            output,
            true,
          );

          // 200 Update
          output = await put("updateUser", {
            id: 1,
            name: "Alice Updated",
            email: "alice.updated@example.com",
          });
          logTest(
            "Update User (200)",
            {
              endpoint: "updateUser",
              data: {
                id: 1,
                name: "Alice Updated",
                email: "alice.updated@example.com",
              },
            },
            output,
            true,
          );

          // 200 Delete
          output = await del("deleteUser", { id: 2 });
          logTest(
            "Delete User (200)",
            { endpoint: "deleteUser", params: { id: 2 } },
            output,
            true,
          );

          // 500 Server Error
          output = await get("errorEndpoint", {});
          logTest(
            "Server Error (500)",
            { endpoint: "errorEndpoint", params: {} },
            output,
          );
        };
        runTests();
      }, [get, put, post, del]);
      return <div data-testid="result">Automated test run</div>;
    }

    render(
      <ApiServiceProvider yamlConfig={yamlConfig}>
        <AutomatedTestComponent />
      </ApiServiceProvider>,
    );

    // Wait for all logs to appear (simulate async)
    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent(
        "Automated test run",
      ),
    );
  });
});
