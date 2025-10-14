import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

// Mock the auth handlers
vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

import { handlers } from "@/lib/auth";

describe("/api/auth/[...nextauth]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should call the NextAuth GET handler", async () => {
      const mockResponse = new Response("GET response", { status: 200 });
      vi.mocked(handlers.GET).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/session");
      const response = await GET(request);

      expect(handlers.GET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it("should handle GET errors gracefully", async () => {
      const mockError = new Error("Auth GET error");
      vi.mocked(handlers.GET).mockRejectedValueOnce(mockError);

      const request = new NextRequest("http://localhost:3000/api/auth/session");

      await expect(GET(request)).rejects.toThrow("Auth GET error");
      expect(handlers.GET).toHaveBeenCalledWith(request);
    });

    it("should pass through NextAuth GET response headers", async () => {
      const mockResponse = new Response("GET response", { status: 200 });
      
      // Mock the headers.get method to return expected values
      vi.spyOn(mockResponse.headers, 'get').mockImplementation((name: string) => {
        if (name.toLowerCase() === 'set-cookie') {
          return "next-auth.session=abc123; Path=/; HttpOnly";
        }
        if (name.toLowerCase() === 'content-type') {
          return "application/json";
        }
        return null;
      });
      
      vi.mocked(handlers.GET).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/session");
      const response = await GET(request);

      expect(response.headers.get("Set-Cookie")).toBe(
        "next-auth.session=abc123; Path=/; HttpOnly"
      );
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle different NextAuth GET endpoints", async () => {
      const endpoints = [
        "http://localhost:3000/api/auth/session",
        "http://localhost:3000/api/auth/providers",
        "http://localhost:3000/api/auth/csrf",
        "http://localhost:3000/api/auth/signin",
        "http://localhost:3000/api/auth/signout",
      ];

      for (const endpoint of endpoints) {
        const mockResponse = new Response(`Response for ${endpoint}`, { status: 200 });
        vi.mocked(handlers.GET).mockResolvedValueOnce(mockResponse);

        const request = new NextRequest(endpoint);
        const response = await GET(request);

        expect(handlers.GET).toHaveBeenCalledWith(request);
        expect(response).toBe(mockResponse);
      }

      expect(handlers.GET).toHaveBeenCalledTimes(endpoints.length);
    });
  });

  describe("POST", () => {
    it("should call the NextAuth POST handler", async () => {
      const mockResponse = new Response("POST response", { status: 200 });
      vi.mocked(handlers.POST).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password" }),
      });
      const response = await POST(request);

      expect(handlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it("should handle POST errors gracefully", async () => {
      const mockError = new Error("Auth POST error");
      vi.mocked(handlers.POST).mockRejectedValueOnce(mockError);

      const request = new NextRequest("http://localhost:3000/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password" }),
      });

      await expect(POST(request)).rejects.toThrow("Auth POST error");
      expect(handlers.POST).toHaveBeenCalledWith(request);
    });

    it("should pass through NextAuth POST response with authentication cookies", async () => {
      const mockResponse = new Response(
        JSON.stringify({ url: "http://localhost:3000/dashboard" }),
        { status: 200 }
      );
      
      // Mock the headers.get method to return expected values
      vi.spyOn(mockResponse.headers, 'get').mockImplementation((name: string) => {
        if (name.toLowerCase() === 'set-cookie') {
          return "next-auth.session-token=xyz789; Path=/; HttpOnly; Secure";
        }
        if (name.toLowerCase() === 'content-type') {
          return "application/json";
        }
        return null;
      });
      
      vi.mocked(handlers.POST).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password" }),
      });
      const response = await POST(request);

      expect(response.headers.get("Set-Cookie")).toBe(
        "next-auth.session-token=xyz789; Path=/; HttpOnly; Secure"
      );
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle authentication POST requests with credentials", async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: "1", email: "test@example.com" } }),
        { status: 200 }
      );
      vi.mocked(handlers.POST).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=test@example.com&password=password123",
      });
      const response = await POST(request);

      expect(handlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it("should handle signout POST requests", async () => {
      const mockResponse = new Response(
        JSON.stringify({ url: "http://localhost:3000/" }),
        { status: 200 }
      );
      
      // Mock the headers.get method to return expected values
      vi.spyOn(mockResponse.headers, 'get').mockImplementation((name: string) => {
        if (name.toLowerCase() === 'set-cookie') {
          return "next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        return null;
      });
      
      vi.mocked(handlers.POST).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "csrfToken=abc123",
      });
      const response = await POST(request);

      expect(handlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(response.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    });

    it("should handle CSRF token validation", async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: "CSRF token mismatch" }),
        { status: 400 }
      );
      vi.mocked(handlers.POST).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=test@example.com&password=password&csrfToken=invalid",
      });
      const response = await POST(request);

      expect(handlers.POST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(response.status).toBe(400);
    });
  });

  describe("Runtime Configuration", () => {
    it("should be configured for Node.js runtime", async () => {
      // Import the module to check the runtime export
      const route = await import("../route");
      expect(route.runtime).toBe("nodejs");
    });
  });

  describe("Handler Export", () => {
    it("should export GET and POST handlers from NextAuth", () => {
      expect(typeof GET).toBe("function");
      expect(typeof POST).toBe("function");
    });

    it("should properly reference the handlers from auth configuration", async () => {
      // Verify that the exported handlers are the same as the imported ones
      expect(GET).toBe(handlers.GET);
      expect(POST).toBe(handlers.POST);
    });
  });
});